import { MathUtils, Vector3 } from "three";
import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { CameraView } from "./camera-view.ts";

/** Horizontal angle (degrees) of the camera around the look-at point. */
function orbitAngle(world: World): number {
  const offset = world.camera.position.clone().sub(new Vector3(0, 0, 0));
  return MathUtils.radToDeg(Math.atan2(offset.x, offset.z));
}

function setup(swayDegrees: number) {
  const world = new World();
  const room = world.createRoot("room");
  room.add(CameraView, { position: [0, 3, 10], lookAt: [0, 0, 0], swayDegrees, swayPeriod: 20 });
  return { world, room };
}

describe("CameraView", () => {
  it("places and aims the camera", () => {
    const { world } = setup(0);
    expect(world.camera.position.toArray()).toEqual([0, 3, 10]);
    const ahead = new Vector3(0, 0, -1).applyQuaternion(world.camera.quaternion);
    expect(ahead.z).toBeLessThan(0);
  });

  it("sways side to side around the look-at point, keeping distance and height", () => {
    const { world, room } = setup(5);
    room.update(5); // a quarter of the period: full swing one way
    const first = orbitAngle(world);
    expect(Math.abs(first)).toBeCloseTo(5);
    expect(world.camera.position.y).toBeCloseTo(3);
    expect(Math.hypot(world.camera.position.x, world.camera.position.z)).toBeCloseTo(10);
    room.update(10); // three quarters: full swing the other way
    expect(orbitAngle(world)).toBeCloseTo(-first);
  });

  it("pauses while the camera is manual, then returns to its view", () => {
    const { world, room } = setup(5);
    world.manualCamera = true;
    world.camera.position.set(99, 99, 99);
    room.update(5);
    expect(world.camera.position.x).toBe(99);
    world.manualCamera = false;
    room.update(0);
    expect(world.camera.position.toArray().map((n) => Math.round(n))).toEqual([0, 3, 10]);
  });
});
