import { describe, expect, it } from "vite-plus/test";
import { driftAudienceState } from "../characters/crowd.ts";
import { World } from "../core/world.ts";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { createAudienceMember } from "../prefabs/audience-member.ts";
import { AudienceModel } from "../traits/audience-model.ts";
import { type CrowdTick, CROWD_TICK, CrowdSimulation } from "../traits/crowd-simulation.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { Seat } from "../traits/seat.ts";
import { Transform } from "../traits/transform.ts";

const evenPersonality = {
  gullibility: 0.5,
  intelligence: 0.5,
  superstition: 0.5,
  faithAffinity: 0.5,
  forgiveness: 0.5,
  sociability: 0.5,
};

/** A room with one chair at each x offset, spaced 0.78 m apart, all in one row. */
function seatedRoom(room: ReturnType<World["createRoot"]>, xs: number[], engagement: number[]) {
  return xs.map((x, i) => {
    const chair = spawnSpec(room, {
      kind: "chair",
      traits: [trait(Transform, { position: [x, 0, 0] }), trait(Seat)],
    });
    return spawnSpec(
      chair,
      createAudienceMember([0, 0.5, 0], 100 + i, { approval: 0, engagement: engagement[i]! }),
    );
  });
}

describe("audience drift", () => {
  it("makes an unwatched crowd bored while a sociable one spreads its mood", () => {
    const alone = { approval: 0.2, engagement: 0.65 };
    driftAudienceState(alone, evenPersonality, []);
    expect(alone.engagement).toBeCloseTo(0.63, 5);
    expect(alone.approval).toBeCloseTo(0.2, 5);

    const beside = { approval: 0, engagement: 0.65 };
    driftAudienceState(beside, evenPersonality, [
      { state: { approval: -1, engagement: 0 }, weight: 0.5 },
    ]);
    // Bored first (0.63), then a quarter-strength pull toward a rapt, hostile neighbour.
    expect(beside.engagement).toBeCloseTo(0.63 * (1 - 0.3 * 0.25), 5);
    expect(beside.approval).toBeCloseTo(-1 * 0.2 * 0.25, 5);
  });

  it("leaves someone with no sociability untouched by their neighbours", () => {
    const lonely = { approval: 0.5, engagement: 0.65 };
    driftAudienceState(lonely, { ...evenPersonality, sociability: 0 }, [
      { state: { approval: -1, engagement: 0 }, weight: 0.5 },
    ]);
    expect(lonely.approval).toBeCloseTo(0.5, 5);
    expect(lonely.engagement).toBeCloseTo(0.63, 5);
  });

  it("keeps state in bounds however loud the room gets", () => {
    const state = { approval: 0.99, engagement: 0.01 };
    const loud = Array.from({ length: 8 }, () => ({
      state: { approval: 1, engagement: 1 },
      weight: 0.5,
    }));
    driftAudienceState(state, { ...evenPersonality, sociability: 1 }, loud);
    expect(state.approval).toBeLessThanOrEqual(1);
    expect(state.engagement).toBeLessThanOrEqual(1);
  });
});

describe("CrowdSimulation", () => {
  it("updates once per tick, not once per frame, and reports the round time", () => {
    const world = new World();
    const room = world.createRoot("room");
    room.add(GameTimer);
    room.add(CrowdSimulation);
    const [person] = seatedRoom(room, [0], [0.65]);
    const ticks: CrowdTick[] = [];
    room.on(CROWD_TICK, (payload) => ticks.push(payload as CrowdTick));

    world.update(0.4);
    expect(person.settingsOf(AudienceModel)!.state.engagement).toBeCloseTo(0.65, 5);
    world.update(0.6);
    expect(ticks).toEqual([{ tick: 1, atSeconds: 1 }]);
    expect(person.settingsOf(AudienceModel)!.state.engagement).toBeCloseTo(0.63, 5);
    world.update(1.5);
    expect(ticks.map((t) => t.tick)).toEqual([1, 2]);
  });

  it("gives each seated member the neighbours next to it, weighted by seat position", () => {
    const world = new World();
    const room = world.createRoot("room");
    room.add(CrowdSimulation);
    const [left, middle, right, distant] = seatedRoom(room, [-0.78, 0, 0.78, 2.34], [0, 0.9, 0, 0]);
    world.update(1);
    const engagement = (o: typeof left) => o!.settingsOf(AudienceModel)!.state.engagement;
    // The engaged person in the middle lifts both neighbours and is dragged down by them.
    expect(engagement(left)).toBeGreaterThan(0);
    expect(engagement(right)).toBeGreaterThan(0);
    expect(engagement(middle)).toBeLessThan(0.9 - 0.02);
    // Two seats away is beyond the neighbour radius: boredom alone, which clamps at zero.
    expect(engagement(distant)).toBe(0);
  });

  it("replays exactly when the same steps are made in the same order", () => {
    const run = () => {
      const world = new World();
      const room = world.createRoot("room");
      room.add(CrowdSimulation);
      const people = seatedRoom(room, [-0.78, 0, 0.78], [0.9, 0.2, 0.5]);
      for (let i = 0; i < 30; i++) world.update(1);
      return people.map((p) => ({ ...p.settingsOf(AudienceModel)!.state }));
    };
    expect(run()).toEqual(run());
  });
});
