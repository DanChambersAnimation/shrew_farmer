import { describe, expect, it } from "vite-plus/test";
import { rooms } from "../core/room-registry.ts";
import { World } from "../core/world.ts";

import.meta.glob(["./*.ts", "!./*.test.ts"], { eager: true });

describe("registered rooms", () => {
  it("includes dev0, with every seat filled", () => {
    expect(rooms.get("dev0")?.tags).toContain("dev");
    const room = rooms.load(new World(), "dev0");
    const all = [...room.descendants()];
    const seats = all.filter((o) => o.kind === "chair");
    const people = all.filter((o) => o.kind === "audience-member");
    expect(seats.length).toBeGreaterThan(0);
    expect(people.length).toBe(seats.length);
    expect(people.every((p) => p.parent?.kind === "chair")).toBe(true);
  });

  for (const def of rooms.list()) {
    it(`${def.name} builds and disposes cleanly`, () => {
      const world = new World();
      const room = rooms.load(world, def.name);
      expect(room.children.length).toBeGreaterThan(0);
      world.clear();
      expect(world.scene.children).toEqual([]);
      expect(world.scene.background).toBeNull();
    });
  }
});
