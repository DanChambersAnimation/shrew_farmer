import { describe, expect, it } from "vite-plus/test";
import { rooms } from "../core/room-registry.ts";
import type { GameObject } from "../core/game-object.ts";
import { World } from "../core/world.ts";
import { AudienceModel } from "../traits/audience-model.ts";
import { PaperFigure } from "../traits/paper-figure.ts";
import { Seat } from "../traits/seat.ts";
import { GameTimer } from "../traits/game-timer.ts";

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
    const states = people.map((p) => p.settingsOf(AudienceModel)!.state);
    expect(new Set(states.map((s) => `${s.approval}/${s.engagement}`)).size).toBe(people.length);
  });

  it("updates the figure from mutable state while preserving appearance", () => {
    const world = new World();
    const room = rooms.load(world, "dev0");
    const person = [...room.descendants()].find((o) => o.kind === "audience-member")!;
    const model = person.settingsOf(AudienceModel)!;
    const figure = person.settingsOf(PaperFigure)!;
    const appearance = structuredClone(model.appearance);
    model.state.approval = -0.9;
    model.state.engagement = 0.95;
    world.update(0);
    expect(figure.slots.face).toBe("frown");
    expect(figure.slots.arms).toBe("crossed");
    model.state.engagement = 0.05;
    world.update(0);
    expect(figure.slots.face).toBe("asleep");
    expect(model.appearance).toEqual(appearance);
  });

  it("dev1 seats exactly one audience member", () => {
    const { seats, people, seated } = census("dev1");
    expect(seats.length).toBe(1);
    expect(people.length).toBe(1);
    expect(seated).toBe(true);
  });

  it("dev2 starts a one-minute timer", () => {
    const room = rooms.load(new World(), "dev2");
    expect(room.settingsOf(GameTimer)).toMatchObject({
      durationSeconds: 60,
      elapsedSeconds: 0,
      running: true,
    });
    expect(rooms.load(new World(), "dev1").has(GameTimer)).toBe(false);
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
