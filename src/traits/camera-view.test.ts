import { describe, expect, it } from "vite-plus/test";
import { Vector3 } from "three";
import { World } from "../core/world.ts";
import { CameraView } from "./camera-view.ts";

describe("camera sway", () => {
  it("completes a twelve-second cycle with ten-degree peaks while facing its target", () => {
    const world = new World();
    world.createRoot("room").add(CameraView, {
      position: [0, 3, 8],
      lookAt: [0, 1, -8],
      swayDegrees: 10,
      swayPeriodSeconds: 12,
    });
    const start = world.camera.position.clone();
    world.update(3);
    const peak = world.camera.position.clone();
    const offset = Math.atan2(-peak.x, peak.z + 8);
    expect(offset).toBeCloseTo((10 * Math.PI) / 180, 5);
    expect(peak.y).toBe(3);
    expect(
      world.camera
        .getWorldDirection(new Vector3())
        .distanceTo(new Vector3(0, 1, -8).sub(peak).normalize()),
    ).toBeLessThan(1e-10);
    world.update(3);
    expect(world.camera.position.distanceTo(start)).toBeLessThan(1e-10);
    world.update(3);
    const oppositePeak = world.camera.position.clone();
    expect(Math.atan2(-oppositePeak.x, oppositePeak.z + 8)).toBeCloseTo((-10 * Math.PI) / 180, 5);
    world.update(3);
    expect(world.camera.position.distanceTo(start)).toBeLessThan(1e-10);
  });
});
