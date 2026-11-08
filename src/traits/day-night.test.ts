import { Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { DayNight, GroupGlow, Sky } from "./day-night.ts";
import { Shape } from "./shape.ts";

describe("day and night", () => {
  it("DayNight puts daylight up by day and streetlights up by night", () => {
    const world = new World();
    const room = world.createRoot("room").add(DayNight);
    room.update(0);
    expect(world.lightLevels.get("daylight")).toBe(1);
    expect(world.lightLevels.get("streetlight")).toBe(0);
    world.outside = "night";
    room.update(0);
    expect(world.lightLevels.get("daylight")).toBe(0);
    expect(world.lightLevels.get("streetlight")).toBe(1);
  });

  it("GroupGlow makes a bulb glow only when its group is up", () => {
    const world = new World();
    const bulb = world
      .createRoot("room")
      .spawn("bulb", [
        trait(Shape, { emissive: 0xffa040 }),
        trait(GroupGlow, { group: "streetlight", intensity: 3 }),
      ]);
    const material = (bulb.node.children[0] as Mesh).material as MeshStandardMaterial;
    world.lightLevels.set("streetlight", 0);
    bulb.update(0);
    expect(material.emissiveIntensity).toBe(0);
    world.lightLevels.set("streetlight", 1);
    bulb.update(0);
    expect(material.emissiveIntensity).toBe(3);
  });

  it("Sky changes colour with the time of day", () => {
    const world = new World();
    const room = world.createRoot("room").add(Sky, { day: 0x0000ff, night: 0x000011 });
    const dome = room.node.children.find((c) => c instanceof Mesh) as Mesh<
      never,
      MeshBasicMaterial
    >;
    room.update(0);
    expect(dome.material.color.getHex()).toBe(0x0000ff);
    world.outside = "night";
    room.update(0);
    expect(dome.material.color.getHex()).toBe(0x000011);
  });
});
