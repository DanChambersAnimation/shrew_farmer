import { describe, expect, it } from "vite-plus/test";
import { renderRig } from "../paper/rig.ts";
import { AUDIENCE, randomAppearance } from "./audience.ts";
import { audienceVisual, randomAudienceState, randomPersonality } from "./audience-model.ts";

describe("audience rig", () => {
  it("renders the visual states without changing base appearance", () => {
    const appearance = randomAppearance(7);
    for (const approval of [-1, 0, 1]) {
      for (const engagement of [0, 0.25, 0.6, 1]) {
        const visual = audienceVisual({ approval, engagement });
        expect(
          renderRig(
            AUDIENCE,
            { ...appearance.slots, face: visual.face, arms: visual.arms },
            undefined,
            appearance.params,
          ),
        ).not.toContain("{{");
      }
    }
  });

  it("gives repeatable, varied looks from seeds", () => {
    expect(randomAppearance(7)).toEqual(randomAppearance(7));
    const looks = Array.from({ length: 30 }, (_, i) => JSON.stringify(randomAppearance(i)));
    expect(new Set(looks).size).toBe(30);
    for (let i = 0; i < 30; i++) {
      const appearance = randomAppearance(i);
      expect(renderRig(AUDIENCE, appearance.slots, undefined, appearance.params)).not.toContain(
        "{{",
      );
    }
  });

  it("samples personality independently around the middle", () => {
    expect(randomPersonality(7)).toEqual(randomPersonality(7));
    const samples = Array.from({ length: 1000 }, (_, seed) => randomPersonality(seed));
    for (const name of Object.keys(samples[0]!) as (keyof (typeof samples)[number])[]) {
      const values = samples.map((person) => person[name]);
      expect(values.every((value) => value >= 0 && value <= 1)).toBe(true);
      expect(values.filter((value) => value >= 0.33 && value <= 0.67).length).toBeGreaterThan(500);
      expect(values.reduce((total, value) => total + value, 0) / values.length).toBeCloseTo(0.5, 1);
    }
  });

  it("starts people paying attention, 65% of the way engaged give or take a tenth", () => {
    expect(randomAudienceState(7)).toEqual(randomAudienceState(7));
    const samples = Array.from({ length: 1000 }, (_, seed) => randomAudienceState(seed));
    const engagement = samples.map((state) => state.engagement);
    const mean = engagement.reduce((total, value) => total + value, 0) / engagement.length;
    const variance =
      engagement.reduce((total, value) => total + (value - mean) ** 2, 0) / engagement.length;
    // Sampling noise over 1000 people, plus the clamp at 1 trimming the top tail.
    expect(Math.abs(mean - 0.65)).toBeLessThan(0.02);
    expect(Math.sqrt(variance)).toBeCloseTo(0.1, 1);
    expect(engagement.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(samples.every((state) => state.approval >= -1 && state.approval <= 1)).toBe(true);
  });
});
