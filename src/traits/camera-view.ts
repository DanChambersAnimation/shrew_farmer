import { MathUtils } from "three";
import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

/**
 * Points the world camera from `position` at `lookAt` (both in world space).
 * With `swayDegrees` set, the camera slowly orbits side to side around
 * `lookAt` (a sine wave lasting `swayPeriod` seconds). Scripted motion pauses
 * while the world's camera is under manual control (e.g. noclip).
 */
export const CameraView = defineTrait({
  name: "camera-view",
  defaults: {
    position: [0, 1.7, 5] as Vec3,
    lookAt: [0, 1.7, 0] as Vec3,
    fov: 50,
    swayDegrees: 0,
    swayPeriod: 22,
  },
  setup({ world, settings: s }) {
    const { camera } = world;
    let elapsed = 0;
    const aim = () => {
      const angle =
        MathUtils.degToRad(s.swayDegrees) * Math.sin((2 * Math.PI * elapsed) / s.swayPeriod);
      const [px, py, pz] = s.position;
      const [lx, , lz] = s.lookAt;
      const [dx, dz] = [px - lx, pz - lz];
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      camera.position.set(lx + dx * cos - dz * sin, py, lz + dx * sin + dz * cos);
      camera.fov = s.fov;
      camera.lookAt(...s.lookAt);
      camera.updateProjectionMatrix();
    };
    aim();
    let wasManual = false;
    return {
      update(dt) {
        if (world.manualCamera) {
          wasManual = true;
          return;
        }
        elapsed += dt;
        // Re-aim every frame while swaying, and once when manual control ends.
        if (s.swayDegrees !== 0 || wasManual) aim();
        wasManual = false;
      },
    };
  },
});
