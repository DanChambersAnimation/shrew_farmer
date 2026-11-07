import { AmbientLight } from "three";
import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { Light } from "./light.ts";
import { CUE_CHANGED, LightingCues, NEXT_CUE } from "./lighting-cues.ts";

function setup() {
  const world = new World();
  const room = world.createRoot("room");
  room.add(LightingCues, {
    cues: { House: { house: 1, spot: 0 }, Spot: { house: 0, spot: 1 } },
  });
  const house = room.spawn("house", [
    trait(Light, { kind: "ambient", intensity: 2, group: "house", fade: 1 }),
  ]);
  const plain = room.spawn("plain", [trait(Light, { kind: "ambient", intensity: 3 })]);
  const intensity = (o: typeof house) =>
    (o.node.children.find((c) => c instanceof AmbientLight) as AmbientLight).intensity;
  return { world, room, house, plain, intensity };
}

describe("lighting cues", () => {
  it("starts in the first cue", () => {
    const { world, house, intensity } = setup();
    expect(world.lightLevels.get("house")).toBe(1);
    expect(intensity(house)).toBe(2);
  });

  it("cycles cues and fades grouped lights; ungrouped lights are unaffected", () => {
    const { world, room, house, plain, intensity } = setup();
    const seen: unknown[] = [];
    world.events.on(CUE_CHANGED, (name) => seen.push(name));
    world.events.emit(NEXT_CUE);
    expect(seen).toEqual(["Spot"]);
    room.update(0.5); // half way through a 1 s fade
    expect(intensity(house)).toBeCloseTo(1);
    room.update(0.5);
    expect(intensity(house)).toBeCloseTo(0);
    expect(intensity(plain)).toBe(3);
    world.events.emit(NEXT_CUE);
    expect(seen).toEqual(["Spot", "House"]);
  });

  it("clears the levels when the room goes", () => {
    const { world } = setup();
    world.clear();
    expect(world.lightLevels.size).toBe(0);
  });
});
