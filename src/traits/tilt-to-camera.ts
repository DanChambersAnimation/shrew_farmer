import { Vector3 } from "three";
import { defineTrait } from "../core/trait.ts";
import { PaperFigure } from "./paper-figure.ts";

/**
 * Keeps the part of a paper figure above its lean row (e.g. the head, above the
 * neck) flat-on to the camera, by setting the figure's lean to the camera's
 * height angle as seen from that row. Pair with an upright Billboard, which
 * handles turning left and right. Needs PaperFigure (with `lean.from` set),
 * attached first. The angle is rounded to `step` degrees to avoid rebuilding
 * the figure for tiny camera movements.
 */
export const TiltToCamera = defineTrait({
  name: "tilt-to-camera",
  defaults: { step: 0.5, maxDegrees: 60 },
  setup({ object, world, settings }) {
    const figure = object.settingsOf(PaperFigure);
    if (!figure) throw new Error(`TiltToCamera needs PaperFigure on "${object.kind}"`);
    // Height of the pivot row above the object's origin, from the figure's own geometry.
    const pivotHeight = (): number => {
      const { profile, lean, anchor, scale } = figure;
      const exact = profile.find(([v]) => v === lean.from);
      return exact ? exact[1] : (anchor[1] - lean.from) * scale;
    };
    const pivot = new Vector3();
    const camera = new Vector3();
    return {
      update() {
        object.node.getWorldPosition(pivot);
        pivot.y += pivotHeight();
        world.camera.getWorldPosition(camera);
        const horizontal = Math.hypot(camera.x - pivot.x, camera.z - pivot.z);
        const elevation = (Math.atan2(camera.y - pivot.y, horizontal) * 180) / Math.PI;
        const clamped = Math.max(-settings.maxDegrees, Math.min(settings.maxDegrees, elevation));
        const degrees = Math.round(clamped / settings.step) * settings.step;
        if (degrees !== figure.lean.degrees) figure.lean = { ...figure.lean, degrees };
      },
    };
  },
});
