import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { createAudienceMember } from "../prefabs/audience-member.ts";
import { spawnSpec } from "../core/spec.ts";
import { AudienceModel, randomAudienceMotion } from "./audience-model.ts";

describe("audience motion", () => {
  it("gives each member a repeatable, slightly different slow sway near 2 cm and 9 seconds", () => {
    expect(randomAudienceMotion(42)).toEqual(randomAudienceMotion(42));
    expect(randomAudienceMotion(42)).not.toEqual(randomAudienceMotion(43));
    const profiles = Array.from({ length: 100 }, (_, seed) => randomAudienceMotion(seed));
    const mean = (values: number[]) =>
      values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean(profiles.map((profile) => profile.amplitude))).toBeCloseTo(0.02, 2);
    expect(mean(profiles.map((profile) => profile.period))).toBeCloseTo(9, 0);
  });

  it("moves around the seat without drifting over repeated cycles", () => {
    const world = new World();
    const room = world.createRoot("room");
    const person = spawnSpec(room, createAudienceMember([0, 0.5, 0], 42));
    const motion = person.settingsOf(AudienceModel)!.motion;
    const start = person.node.position.clone();
    world.update(motion.period / 4);
    const first = person.node.position.clone();
    world.update(motion.period / 4);
    world.update(motion.period / 4);
    world.update(motion.period / 4);
    const next = person.node.position.clone();
    expect(first.distanceTo(start)).toBeGreaterThan(0.001);
    expect(next.x).toBeCloseTo(start.x + motion.amplitude * Math.sin(motion.phase), 5);
    expect(Math.abs(next.x - start.x)).toBeLessThan(0.026);
    expect(Math.abs(next.y - start.y)).toBeLessThan(0.004);
  });

  it("adds a small tremor when an engaged member becomes angry", () => {
    const world = new World();
    const room = world.createRoot("room");
    const calm = spawnSpec(
      room,
      createAudienceMember([0, 0.5, 0], 42, { approval: 0, engagement: 1 }),
    );
    const angry = spawnSpec(
      room,
      createAudienceMember([0, 0.5, 0], 42, { approval: -1, engagement: 1 }),
    );
    const differences: number[] = [];
    for (let i = 0; i < 30; i++) {
      world.update(0.01);
      differences.push(Math.abs(angry.node.position.x - calm.node.position.x));
    }
    expect(Math.max(...differences)).toBeGreaterThan(0.003);
    expect(Math.max(...differences)).toBeLessThanOrEqual(0.004);
  });
});
