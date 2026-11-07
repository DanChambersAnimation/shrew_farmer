import { MathUtils, Vector3 } from "three";

const UP = new Vector3(0, 1, 0);
import { defineTrait } from "../core/trait.ts";

/**
 * Keeps the object turned toward the camera. "full" also tilts to face it;
 * "upright" only turns around the vertical axis, so the object never leans
 * into things behind it (e.g. a chair back).
 *
 * `yaw` then swivels it about the world's vertical axis by a fixed angle
 * (degrees, positive = anticlockwise seen from above), e.g. so a figure turns
 * toward something other than the camera. It turns around the vertical even
 * when the figure is tilted, so it swivels on the spot rather than twisting.
 *
 * `stretch` (upright only) scales the object vertically to undo the squash of
 * being seen from above or below, up to `maxStretch`.
 */
export const Billboard = defineTrait({
  name: "billboard",
  defaults: {
    mode: "full" as "full" | "upright",
    stretch: false,
    maxStretch: 2,
    yaw: 0,
  },
  setup({ object, world, settings }) {
    const { node } = object;
    const baseScaleY = node.scale.y;
    const target = new Vector3();
    const self = new Vector3();
    return {
      update() {
        node.parent?.updateWorldMatrix(true, false);
        world.camera.getWorldPosition(target);
        node.getWorldPosition(self);
        if (settings.mode === "full") {
          node.lookAt(target);
          node.rotateOnWorldAxis(UP, MathUtils.degToRad(settings.yaw));
          return;
        }
        const horizontal = Math.hypot(target.x - self.x, target.z - self.z);
        const distance = target.distanceTo(self);
        const stretch =
          settings.stretch && horizontal > 0
            ? Math.min(distance / horizontal, settings.maxStretch)
            : 1;
        node.scale.y = baseScaleY * stretch;
        target.y = self.y;
        node.lookAt(target);
        node.rotateOnWorldAxis(UP, MathUtils.degToRad(settings.yaw));
      },
    };
  },
});
