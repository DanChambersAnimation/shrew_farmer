import { describe, expect, it } from "vite-plus/test";
import { rooms } from "../core/room-registry.ts";
import type { GameObject } from "../core/game-object.ts";
import { World } from "../core/world.ts";
import { CrowdSimulation } from "../traits/crowd-simulation.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { Gambits } from "../traits/gambits.ts";
import { LightingCues } from "../traits/lighting-cues.ts";
import { AudienceModel } from "../traits/audience-model.ts";
import { PaperFigure } from "../traits/paper-figure.ts";
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

  it("dev4 starts a one-minute timer; rooms without one have no clock", () => {
    const room = rooms.load(new World(), "dev4");
    expect(room.settingsOf(GameTimer)).toMatchObject({
      durationSeconds: 60,
      elapsedSeconds: 0,
      running: true,
    });
    expect(rooms.load(new World(), "dev1").has(GameTimer)).toBe(false);
  });

  it("dev3 is the playable hall: a round clock under a simulated crowd", () => {
    const { seats, people, seated } = census("dev3");
    expect(seats.length).toBeGreaterThan(1);
    expect(people.length).toBe(seats.length);
    expect(seated).toBe(true);
    const room = rooms.load(new World(), "dev3");
    expect(room.settingsOf(GameTimer)).toMatchObject({ durationSeconds: 60, running: true });
    expect(room.has(CrowdSimulation)).toBe(true);
  });

  it("dev8 displays every designed gambit medal", () => {
    const room = rooms.load(new World(), "dev8");
    expect(room.settingsOf(Gambits)?.hand).toEqual([
      "personal-anecdote",
      "anecdote-callback",
      "rule-of-three",
      "pious-statement",
      "praise-jesus",
      "t-shirt-cannon",
    ]);
  });

  it("dev5 shows one of each expression, moving out of step", () => {
    const world = new World();
    const room = rooms.load(world, "dev5");
    const people = [...room.descendants()].filter((o) => o.kind === "audience-member");
    expect(people.length).toBe(7);
    const states = people.map((p) => p.settingsOf(AudienceModel)!.state);
    expect(new Set(states.map((s) => `${s.approval}/${s.engagement}`)).size).toBe(7);
    world.update(0.5);
    // Different per-person timing means the faces do not move together.
    const faces = people.map((p) => Object.values(p.settingsOf(PaperFigure)!.slots).join("/"));
    expect(new Set(faces).size).toBeGreaterThan(1);
    world.clear();
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
