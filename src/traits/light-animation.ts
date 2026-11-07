import type { GameObject } from "../core/game-object.ts";
import { defineTrait } from "../core/trait.ts";
import { Light } from "./light.ts";
import type { Vec3 } from "./types.ts";

/*
 * Small traits that animate a Light on the same object by changing its live
 * settings. Each needs Light attached first. Combine them freely: a sweeping,
 * colour-cycling, pulsing spot is just all three on one light.
 */

function lightOf(object: GameObject, trait: string) {
  const light = object.settingsOf(Light);
  if (!light) throw new Error(`${trait} needs Light on "${object.kind}"`);
  return light;
}

/**
 * Varies brightness: "sine" throbs smoothly, "square" flashes on and off (a
 * strobe). `rate` is cycles per second; brightness runs between `low` and 1.
 */
export const Pulse = defineTrait({
  name: "pulse",
  defaults: { wave: "sine" as "sine" | "square", rate: 1, low: 0, phase: 0 },
  setup({ object, settings: s }) {
    const light = lightOf(object, "Pulse");
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const cycle = (t * s.rate + s.phase) % 1;
        const amount =
          s.wave === "square" ? (cycle < 0.5 ? 1 : 0) : 0.5 - 0.5 * Math.cos(cycle * 2 * Math.PI);
        light.scale = s.low + (1 - s.low) * amount;
      },
      dispose() {
        light.scale = 1;
      },
    };
  },
});

/**
 * Moves where the light aims, around its starting target: a back-and-forth by
 * `amplitude` (metres along each axis), or with `circle` an ellipse instead.
 * One cycle every `period` seconds, offset by `phase` (0..1).
 */
export const Sweep = defineTrait({
  name: "sweep",
  defaults: { amplitude: [2, 0, 0] as Vec3, period: 4, phase: 0, circle: false },
  setup({ object, settings: s }) {
    const light = lightOf(object, "Sweep");
    const base: Vec3 = [...light.target];
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const angle = 2 * Math.PI * (t / s.period + s.phase);
        const [ax, ay, az] = s.amplitude;
        const [sin, cos] = [Math.sin(angle), Math.cos(angle)];
        light.target = s.circle
          ? [base[0] + ax * sin, base[1] + ay * sin, base[2] + az * cos]
          : [base[0] + ax * sin, base[1] + ay * sin, base[2] + az * sin];
      },
      dispose() {
        light.target = base;
      },
    };
  },
});

/** Steps the light through `colors`, `period` seconds per colour, offset by `phase` steps. */
export const ColorCycle = defineTrait({
  name: "color-cycle",
  defaults: { colors: [0xff3b6b, 0x3bd1ff, 0xffd23b] as number[], period: 0.5, phase: 0 },
  setup({ object, settings: s }) {
    const light = lightOf(object, "ColorCycle");
    const original = light.color;
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (s.colors.length === 0) return;
        const step = Math.floor(t / s.period) + s.phase;
        light.color = s.colors[((step % s.colors.length) + s.colors.length) % s.colors.length]!;
      },
      dispose() {
        light.color = original;
      },
    };
  },
});
