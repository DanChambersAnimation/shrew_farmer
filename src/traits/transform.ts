import { MathUtils } from "three";
import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

/** Places the object relative to its parent. Rotation is in degrees. */
export const Transform = defineTrait({
  name: "transform",
  defaults: {
    position: [0, 0, 0] as Vec3,
    rotation: [0, 0, 0] as Vec3,
    scale: [1, 1, 1] as Vec3,
  },
  setup({ object, settings }) {
    const { node } = object;
    node.position.set(...settings.position);
    node.rotation.set(...(settings.rotation.map(MathUtils.degToRad) as Vec3));
    node.scale.set(...settings.scale);
  },
});
