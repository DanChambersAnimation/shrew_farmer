import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { createAudienceMember } from "../prefabs/audience-member.ts";
import { Seat } from "./seat.ts";
import { Transform } from "./transform.ts";
import { GameTimer } from "./game-timer.ts";
import { ROUND_LOST, RoundAudio, majorityDisengaged } from "./round-audio.ts";

function round(engagements: readonly number[]) {
  const world = new World();
  const room = world.createRoot("room").add(GameTimer).add(RoundAudio);
  for (const [index, engagement] of engagements.entries()) {
    const seat = spawnSpec(room, {
      kind: "chair",
      traits: [trait(Transform, { position: [index, 0, 0] }), trait(Seat)],
    });
    spawnSpec(seat, createAudienceMember([0, 0.5, 0], 100 + index, { approval: 0, engagement }));
  }
  return { world, room };
}

describe("round audio", () => {
  it("requires a strict majority below the disengagement threshold", () => {
    expect(majorityDisengaged([])).toBe(false);
    expect(majorityDisengaged([0.1, 0.9])).toBe(false);
    expect(majorityDisengaged([0.1, 0.2, 0.9])).toBe(true);
    expect(majorityDisengaged([0.4, 0.4, 0.1])).toBe(false);
  });

  it("reports a lost round once at timer expiry when most seated people are disengaged", () => {
    const { world, room } = round([0.1, 0.2, 0.9]);
    let lost = 0;
    room.on(ROUND_LOST, () => lost++);
    world.update(59);
    expect(lost).toBe(0);
    world.update(1);
    expect(lost).toBe(1);
    world.update(1);
    expect(lost).toBe(1);
    world.clear();
  });

  it("does not report a loss for a tied room", () => {
    const { world, room } = round([0.1, 0.9]);
    let lost = 0;
    room.on(ROUND_LOST, () => lost++);
    world.update(60);
    expect(lost).toBe(0);
    world.clear();
  });
});
