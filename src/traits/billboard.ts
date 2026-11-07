import { Vector3 } from "three";
import { defineTrait } from "../core/trait.ts";

/**
 * Keeps the object turned toward the camera. "full" also tilts to face it;
 * "upright" only turns around the vertical axis.
 */
export const Billboard = defineTrait({
  name: "billboard",
  defaults: { mode: "full" as "full" | "upright" },
  setup({ object, world, settings }) {
    const target = new Vector3();
    const self = new Vector3();
    return {
      update() {
        const { node } = object;
        node.parent?.updateWorldMatrix(true, false);
        world.camera.getWorldPosition(target);
        if (settings.mode === "upright") target.y = node.getWorldPosition(self).y;
        node.lookAt(target);
      },
    };
  },
});
