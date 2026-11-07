import { FogExp2, Mesh, MeshBasicMaterial } from "three";
import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { Bloom } from "./bloom.ts";
import { Haze } from "./haze.ts";
import { Laser } from "./laser.ts";
import { Light } from "./light.ts";

/** Opacity of the visible beams (additive meshes) under an object. */
const beams = (obj: { node: { traverse(fn: (o: unknown) => void): void } }) => {
  const found: MeshBasicMaterial[] = [];
  obj.node.traverse((o) => {
    if (o instanceof Mesh && o.material instanceof MeshBasicMaterial) found.push(o.material);
  });
  return found;
};

describe("Haze and Bloom", () => {
  it("Haze fogs the air and enables beams, and clears when removed", () => {
    const world = new World();
    const room = world.createRoot("room").add(Haze, { amount: 0.5, density: 0.02 });
    room.update(0);
    expect(world.haze).toBe(0.5);
    expect((world.scene.fog as FogExp2).density).toBe(0.02);
    room.remove(Haze);
    expect(world.haze).toBe(0);
    expect(world.scene.fog).toBeNull();
  });

  it("Bloom sets the world's glow, and clears when removed", () => {
    const world = new World();
    const room = world.createRoot("room").add(Bloom, { strength: 0.4 });
    room.update(0);
    expect(world.bloom?.strength).toBe(0.4);
    room.remove(Bloom);
    expect(world.bloom).toBeNull();
  });
});

describe("visible beams", () => {
  it("a spot's beam shows only in haze", () => {
    const world = new World();
    const room = world.createRoot("room");
    const lamp = room.spawn("spot", [
      trait(Light, { kind: "spot", intensity: 100, target: [0, -5, 0], beam: 1 }),
    ]);
    lamp.update(0);
    expect(beams(lamp)[0]!.opacity).toBe(0);
    room.add(Haze);
    room.update(0);
    expect(beams(lamp)[0]!.opacity).toBeGreaterThan(0);
  });

  it("a laser draws one beam per ray, switched by its light group", () => {
    const world = new World();
    const room = world.createRoot("room");
    world.lightLevels.set("lasers", 0);
    const laser = room.spawn("laser", [trait(Laser, { beams: 5, group: "lasers" })]);
    laser.update(0.1);
    expect(beams(laser)).toHaveLength(5);
    expect(beams(laser).every((m) => m.opacity === 0)).toBe(true);
    world.lightLevels.set("lasers", 1);
    laser.update(0.1);
    expect(beams(laser).every((m) => m.opacity > 0)).toBe(true);
  });
});
