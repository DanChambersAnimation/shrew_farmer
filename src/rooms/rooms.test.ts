import { describe, expect, it } from "vite-plus/test";
import { rooms } from "../core/room-registry.ts";
import type { GameObject } from "../core/game-object.ts";
import { World } from "../core/world.ts";
import { LightingCues } from "../traits/lighting-cues.ts";
import { Seat } from "../traits/seat.ts";

import.meta.glob(["./*.ts", "!./*.test.ts"], { eager: true });

describe("registered rooms", () => {
  /** Seats and seated audience members in a freshly built room. */
  function census(name: string) {
    const all: GameObject[] = [...rooms.load(new World(), name).descendants()];
    const seats = all.filter((o) => o.has(Seat));
    const people = all.filter((o) => o.kind === "audience-member");
    return { seats, people, seated: people.every((p) => p.parent?.has(Seat)) };
  }

  it("dev0 fills every seat in the hall", () => {
    const { seats, people, seated } = census("dev0");
    expect(seats.length).toBeGreaterThan(1);
    expect(people.length).toBe(seats.length);
    expect(seated).toBe(true);
  });

  it("dev2 adds lighting states and a spotlight to the dev0 show; dev0 has neither", () => {
    const lit = rooms.load(new World(), "dev2");
    expect(lit.has(LightingCues)).toBe(true);
    expect([...lit.descendants()].some((o) => o.kind === "spotlight")).toBe(true);
    const plain = rooms.load(new World(), "dev0");
    expect(plain.has(LightingCues)).toBe(false);
    expect([...plain.descendants()].some((o) => o.kind === "spotlight")).toBe(false);
  });

  it("dev1 seats exactly one audience member", () => {
    const { seats, people, seated } = census("dev1");
    expect(seats.length).toBe(1);
    expect(people.length).toBe(1);
    expect(seated).toBe(true);
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
