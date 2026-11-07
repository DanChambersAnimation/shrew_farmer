import { defineTrait } from "../core/trait.ts";
import { PaperFigure } from "./paper-figure.ts";

/**
 * Makes a paper figure look slowly left and right by sweeping its twist
 * (see PaperFigure) through ±`degrees` over `period` seconds. Needs PaperFigure
 * on the same object, attached first.
 */
export const LookAround = defineTrait({
  name: "look-around",
  defaults: { degrees: 30, period: 8 },
  setup({ object, settings }) {
    const figure = object.settingsOf(PaperFigure);
    if (!figure) throw new Error(`LookAround needs PaperFigure on "${object.kind}"`);
    let elapsed = 0;
    return {
      update(dt) {
        elapsed += dt;
        figure.twist = {
          ...figure.twist,
          degrees: settings.degrees * Math.sin((2 * Math.PI * elapsed) / settings.period),
        };
      },
      dispose() {
        figure.twist = { ...figure.twist, degrees: 0 };
      },
    };
  },
});
