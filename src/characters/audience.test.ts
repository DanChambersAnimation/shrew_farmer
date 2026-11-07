import { describe, expect, it } from "vite-plus/test";
import { renderRig } from "../paper/rig.ts";
import { AUDIENCE, MOODS, randomLook } from "./audience.ts";

describe("audience rig", () => {
  it("renders every mood", () => {
    for (const mood of Object.values(MOODS)) {
      expect(renderRig(AUDIENCE, { face: mood.face, arms: mood.arms })).not.toContain("{{");
    }
  });

  it("gives repeatable, varied looks from seeds", () => {
    expect(randomLook(7)).toEqual(randomLook(7));
    const looks = Array.from({ length: 30 }, (_, i) => JSON.stringify(randomLook(i)));
    expect(new Set(looks).size).toBe(30);
    for (let i = 0; i < 30; i++) {
      const look = randomLook(i);
      expect(renderRig(AUDIENCE, look.slots, undefined, look.params)).not.toContain("{{");
    }
  });
});
