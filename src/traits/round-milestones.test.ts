import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { GameTimer } from "./game-timer.ts";
import {
  ROUND_MILESTONE,
  type RoundMilestone,
  RoundMilestones,
  milestoneClip,
} from "./round-milestones.ts";

function round(durationSeconds = 60, at?: number[]) {
  const world = new World();
  const room = world.createRoot("room").add(GameTimer, { durationSeconds });
  room.add(RoundMilestones, at ? { at, fired: [] } : {});
  const seen: RoundMilestone[] = [];
  room.on(ROUND_MILESTONE, (payload) => seen.push(payload as RoundMilestone));
  return { world, room, seen };
}

describe("RoundMilestones", () => {
  it("announces a quarter, half and three-quarters exactly once each", () => {
    const { world, seen } = round();
    for (let i = 0; i < 60; i++) world.update(1);
    expect(seen.map((m) => m.fraction)).toEqual([0.25, 0.5, 0.75]);
    expect(seen.map((m) => Math.round(m.atSeconds))).toEqual([15, 30, 45]);
  });

  it("fires on crossing, not on an exact tick", () => {
    // Frames do not land on the mark, so equality would never match.
    const { world, seen } = round(60, [0.25]);
    world.update(14.9);
    expect(seen).toHaveLength(0);
    world.update(1.2);
    expect(seen.map((m) => m.fraction)).toEqual([0.25]);
  });

  it("keeps quiet after the round ends and never fires twice", () => {
    const { world, seen } = round();
    for (let i = 0; i < 100; i++) world.update(1);
    expect(seen.map((m) => m.fraction)).toEqual([0.25, 0.5, 0.75]);
  });

  it("fires again after the clock is rewound for a new round", () => {
    const { world, room, seen } = round(60, [0.25]);
    for (let i = 0; i < 20; i++) world.update(1);
    expect(seen).toHaveLength(1);
    room.settingsOf(GameTimer)!.elapsedSeconds = 0;
    room.settingsOf(GameTimer)!.running = true;
    for (let i = 0; i < 20; i++) world.update(1);
    expect(seen).toHaveLength(2);
  });

  it("needs a clock beside it", () => {
    const world = new World();
    const room = world.createRoot("room");
    expect(() => room.add(RoundMilestones)).toThrow("requires GameTimer");
  });

  it("names the clip for each standard milestone", () => {
    expect(milestoneClip(0.25)).toBe("round/quarter");
    expect(milestoneClip(0.5)).toBe("round/half");
    expect(milestoneClip(0.75)).toBe("round/three-quarters");
    expect(milestoneClip(0.4)).toBeNull();
  });
});
