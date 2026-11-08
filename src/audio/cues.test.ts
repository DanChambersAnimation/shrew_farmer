import { describe, expect, it } from "vite-plus/test";
import { GAME_LOST, GET_READY, ruleOfThreePitch } from "./cues.ts";

describe("game cues", () => {
  it("uses distinct ascending start and descending loss phrases", () => {
    expect(GET_READY.map((tone) => tone.frequency)).toEqual([523.25, 659.25, 783.99]);
    expect(GAME_LOST.map((tone) => tone.frequency)).toEqual([392, 311.13, 261.63]);
  });

  it("raises each Rule of Three beat by a whole tone", () => {
    const wholeTone = 2 ** (2 / 12);
    expect(ruleOfThreePitch(2) / ruleOfThreePitch(1)).toBeCloseTo(wholeTone);
    expect(ruleOfThreePitch(3) / ruleOfThreePitch(2)).toBeCloseTo(wholeTone);
  });
});
