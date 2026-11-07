import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { LookAround, easeInOutExpo } from "./look-around.ts";
import { PaperFigure } from "./paper-figure.ts";

import "../paper/library.ts";

function figure(look: Parameters<typeof trait<typeof LookAround.defaults>>[1]) {
  const obj = new World().createRoot("room").spawn("speaker", [
    trait(PaperFigure, {
      rig: "speaker-back",
      twist: {
        degrees: 0,
        curve: [
          [440, 0],
          [292, 1],
        ],
      },
    }),
    trait(LookAround, look),
  ]);
  return { obj, twist: () => obj.settingsOf(PaperFigure)!.twist.degrees };
}

describe("easeInOutExpo", () => {
  it("starts and ends gently, and is half way at the middle", () => {
    expect(easeInOutExpo(0)).toBe(0);
    expect(easeInOutExpo(1)).toBe(1);
    expect(easeInOutExpo(0.5)).toBeCloseTo(0.5);
    expect(easeInOutExpo(0.1)).toBeLessThan(0.01);
    expect(easeInOutExpo(0.9)).toBeGreaterThan(0.99);
  });
});

describe("LookAround", () => {
  it("sweep: a sine wave left and right, reset when removed", () => {
    const { obj, twist } = figure({ degrees: 30, period: 8 });
    obj.update(2); // quarter period: full turn one way
    expect(twist()).toBeCloseTo(30);
    obj.update(4); // three quarters: full turn the other way
    expect(twist()).toBeCloseTo(-30);
    obj.remove(LookAround);
    expect(twist()).toBe(0);
  });

  it("glance: snaps to alternate sides every period, then holds", () => {
    const { obj, twist } = figure({ degrees: 40, period: 4, motion: "glance", turn: 1 });
    obj.update(1); // first glance done
    expect(twist()).toBeCloseTo(40);
    obj.update(2.5); // holding until the next glance at t = 4
    expect(twist()).toBeCloseTo(40);
    obj.update(1); // t = 4.5: mid-turn toward -40
    expect(twist()).toBeCloseTo(0, 0);
    obj.update(0.5); // t = 5: turned
    expect(twist()).toBeCloseTo(-40);
    obj.update(4); // t = 9: back the other way
    expect(twist()).toBeCloseTo(40);
  });

  it("requires a PaperFigure", () => {
    const obj = new World().createRoot("room");
    expect(() => obj.add(LookAround)).toThrow(/needs PaperFigure/);
  });
});
