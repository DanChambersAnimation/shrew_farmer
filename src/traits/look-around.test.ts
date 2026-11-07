import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { LookAround } from "./look-around.ts";
import { PaperFigure } from "./paper-figure.ts";

import "../paper/library.ts";

describe("LookAround", () => {
  it("sweeps the figure's twist left and right, and resets it when removed", () => {
    const figure = new World().createRoot("room").spawn("speaker", [
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
      trait(LookAround, { degrees: 30, period: 8 }),
    ]);
    const twist = () => figure.settingsOf(PaperFigure)!.twist.degrees;
    figure.update(2); // quarter period: full turn one way
    expect(twist()).toBeCloseTo(30);
    figure.update(4); // three quarters: full turn the other way
    expect(twist()).toBeCloseTo(-30);
    figure.remove(LookAround);
    expect(twist()).toBe(0);
  });

  it("requires a PaperFigure", () => {
    const obj = new World().createRoot("room");
    expect(() => obj.add(LookAround)).toThrow(/needs PaperFigure/);
  });
});
