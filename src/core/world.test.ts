import { MathUtils, OrthographicCamera } from "three";
import { describe, expect, it } from "vite-plus/test";
import { Shape } from "../traits/shape.ts";
import { trait } from "./trait.ts";
import { World } from "./world.ts";

/** Camera 10 m above the floor looking straight down at the origin. */
function topDown() {
  const world = new World();
  world.camera.position.set(0, 10, 0);
  world.camera.lookAt(0, 0, 0);
  world.camera.aspect = 2;
  return world;
}

describe("World projection", () => {
  it("renders with the perspective camera by default", () => {
    const world = topDown();
    expect(world.viewCamera).toBe(world.camera);
  });

  it("orthographic frames the same area as perspective at the floor", () => {
    const world = topDown();
    world.projection = "orthographic";
    const ortho = world.viewCamera as OrthographicCamera;
    expect(ortho).toBe(world.orthoCamera);
    const halfHeight = 10 * Math.tan(MathUtils.degToRad(world.camera.fov / 2));
    expect(ortho.top).toBeCloseTo(halfHeight);
    expect(ortho.right).toBeCloseTo(halfHeight * 2);
    expect(ortho.position.toArray()).toEqual(world.camera.position.toArray());
  });

  it("picks objects through the orthographic camera", () => {
    const world = topDown();
    const box = world.createRoot("root").spawn("box", [trait(Shape)]);
    world.projection = "orthographic";
    world.pointer.move({ x: 0, y: 0 });
    expect(world.pointer.target).toBe(box);
  });
});
