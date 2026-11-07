import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { Billboard } from "./billboard.ts";

/** A figure at the origin and a camera 4 m away horizontally and 3 m up. */
function setup(settings: Parameters<typeof trait<typeof Billboard.defaults>>[1]) {
  const world = new World();
  world.camera.position.set(0, 3, 4);
  const figure = world.createRoot("room").spawn("figure", [trait(Billboard, settings)]);
  figure.update(0);
  return figure;
}

describe("Billboard", () => {
  it("full mode tilts to face the camera", () => {
    const { node } = setup({ mode: "full" });
    expect(node.rotation.x).toBeLessThan(-0.1);
  });

  it("upright mode only turns, and stretches to undo the view from above", () => {
    const { node } = setup({ mode: "upright", stretch: true });
    expect(node.rotation.x).toBeCloseTo(0);
    expect(node.scale.y).toBeCloseTo(5 / 4); // distance / horizontal distance
  });

  it("caps the stretch", () => {
    const { node } = setup({ mode: "upright", stretch: true, maxStretch: 1.1 });
    expect(node.scale.y).toBeCloseTo(1.1);
  });

  it("turns by a fixed yaw after facing the camera", () => {
    const facing = setup({ mode: "upright" }).node.rotation.y;
    const turned = setup({ mode: "upright", yaw: -45 }).node.rotation.y;
    expect(turned - facing).toBeCloseTo(-Math.PI / 4);
  });
});
