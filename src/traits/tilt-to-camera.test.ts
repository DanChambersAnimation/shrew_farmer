import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { PaperFigure } from "./paper-figure.ts";
import { TiltToCamera } from "./tilt-to-camera.ts";

import "../paper/library.ts";

describe("TiltToCamera", () => {
  it("leans the head back by the camera's height angle, seen from the neck", () => {
    const world = new World();
    // Speaker rig, feet at the origin; lean from row 292 = (534 - 292) * 0.004 ≈ 0.97 m up.
    const figure = world
      .createRoot("room")
      .spawn("figure", [
        trait(PaperFigure, { rig: "speaker", anchor: [200, 534], lean: { degrees: 0, from: 292 } }),
        trait(TiltToCamera, { step: 0.5 }),
      ]);
    const neck = (534 - 292) * 0.004;
    world.camera.position.set(0, neck + 3, 3); // 45° up from the neck
    figure.update(0);
    expect(figure.settingsOf(PaperFigure)!.lean.degrees).toBeCloseTo(45);
  });

  it("requires a PaperFigure", () => {
    expect(() => new World().createRoot("room").add(TiltToCamera)).toThrow(/needs PaperFigure/);
  });
});
