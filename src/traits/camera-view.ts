import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

/** Points the world camera at `lookAt`, optionally swaying around it. */
export const CameraView = defineTrait({
  name: "camera-view",
  defaults: {
    position: [0, 1.7, 5] as Vec3,
    lookAt: [0, 1.7, 0] as Vec3,
    fov: 50,
    swayDegrees: 0,
    swayPeriodSeconds: 30,
  },
  setup({ world: { camera }, settings: s }) {
    camera.fov = s.fov;
    camera.updateProjectionMatrix();
    let elapsed = 0;
    const point = () => {
      const angle =
        ((s.swayDegrees * Math.PI) / 180) * Math.sin((2 * Math.PI * elapsed) / s.swayPeriodSeconds);
      const dx = s.position[0] - s.lookAt[0];
      const dz = s.position[2] - s.lookAt[2];
      camera.position.set(
        s.lookAt[0] + dx * Math.cos(angle) - dz * Math.sin(angle),
        s.position[1],
        s.lookAt[2] + dx * Math.sin(angle) + dz * Math.cos(angle),
      );
      camera.lookAt(...s.lookAt);
    };
    point();
    return {
      update(dt: number) {
        elapsed += dt;
        point();
      },
    };
  },
});
