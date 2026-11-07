import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

/** Points the world camera from `position` at `lookAt` (both in world space). */
export const CameraView = defineTrait({
  name: "camera-view",
  defaults: {
    position: [0, 1.7, 5] as Vec3,
    lookAt: [0, 1.7, 0] as Vec3,
    fov: 50,
  },
  setup({ world: { camera }, settings: s }) {
    camera.position.set(...s.position);
    camera.fov = s.fov;
    camera.lookAt(...s.lookAt);
    camera.updateProjectionMatrix();
  },
});
