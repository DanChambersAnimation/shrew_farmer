import { defineTrait } from "../core/trait.ts";
import { PaperFigure } from "./paper-figure.ts";

/** Exponential ease-in-out: slow start, fast middle, soft stop. */
export function easeInOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
}

/**
 * Makes a paper figure look left and right by driving its twist (see
 * PaperFigure) between ±`degrees`. Needs PaperFigure on the same object,
 * attached first.
 *
 * - "sweep": a continuous sine wave, one full left-right cycle every `period` s.
 * - "glance": every `period` s, snap to look the other way over `turn` s with
 *   exponential ease-in-out, then hold.
 */
export const LookAround = defineTrait({
  name: "look-around",
  defaults: {
    degrees: 30,
    period: 8,
    motion: "sweep" as "sweep" | "glance",
    turn: 0.8,
  },
  setup({ object, settings }) {
    const figure = object.settingsOf(PaperFigure);
    if (!figure) throw new Error(`LookAround needs PaperFigure on "${object.kind}"`);
    let elapsed = 0;
    const angleAt = (t: number): number => {
      const { degrees, period } = settings;
      if (settings.motion === "sweep") return degrees * Math.sin((2 * Math.PI * t) / period);
      // Glance: glance n faces side (-1)^n; each turn starts at n * period.
      const n = Math.floor(t / period);
      const from = n === 0 ? 0 : degrees * (n % 2 === 0 ? -1 : 1);
      const to = degrees * (n % 2 === 0 ? 1 : -1);
      const progress = Math.min(1, (t - n * period) / Math.max(settings.turn, 1e-6));
      return from + (to - from) * easeInOutExpo(progress);
    };
    return {
      update(dt) {
        elapsed += dt;
        figure.twist = { ...figure.twist, degrees: angleAt(elapsed) };
      },
      dispose() {
        figure.twist = { ...figure.twist, degrees: 0 };
      },
    };
  },
});
