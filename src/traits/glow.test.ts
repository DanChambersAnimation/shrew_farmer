import { Mesh, MeshBasicMaterial } from "three";
import { describe, expect, it } from "vite-plus/test";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { chairStack } from "../prefabs/chair.ts";
import { wallClock } from "../prefabs/wall-clock.ts";
import { Bloom } from "./bloom.ts";
import { Glow } from "./glow.ts";
import { Seat } from "./seat.ts";

describe("Glow", () => {
  it("scales with the room's bloom amount and its light group", () => {
    const world = new World();
    const room = world.createRoot("room").add(Bloom, { strength: 0.05 });
    const lamp = room.spawn("lamp", [trait(Glow, { intensity: 0.8, group: "streetlight" })]);
    const card = lamp.node.children.find((c) => c instanceof Mesh) as Mesh<
      never,
      MeshBasicMaterial
    >;
    world.lightLevels.set("streetlight", 1);
    room.update(0);
    expect(card.material.opacity).toBeCloseTo(0.4); // 0.8 x (0.05 x 10) x 1
    world.lightLevels.set("streetlight", 0);
    room.update(0);
    expect(card.visible).toBe(false);
    room.remove(Bloom);
    world.lightLevels.set("streetlight", 1);
    room.update(0);
    expect(card.visible).toBe(false); // no bloom in the room: no glow
  });
});

describe("hall props", () => {
  it("stacked chairs are furniture, not seats", () => {
    const room = new World().createRoot("room");
    const stack = spawnSpec(room, chairStack([0, 0, 0], 5));
    expect(stack.children).toHaveLength(5);
    expect([...stack.descendants()].some((o) => o.has(Seat))).toBe(false);
  });

  it("the wall clock's hands show the time", () => {
    const room = new World().createRoot("room");
    const clock = spawnSpec(room, wallClock([0, 0, 0]));
    clock.update(0);
    const minute = clock.children.find((c) => c.kind === "minute-hand")!.node;
    const expected = -((new Date().getMinutes() + new Date().getSeconds() / 60) / 60) * Math.PI * 2;
    expect(minute.rotation.z).toBeCloseTo(expected, 1);
  });
});
