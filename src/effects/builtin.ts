import type { EffectDef } from "./registry.ts";
import { effects } from "./registry.ts";

/** Fade light groups to new levels, the same way LightingCues does. */
function lights(id: string, levels: Record<string, number>): EffectDef {
  return {
    id,
    kind: "lighting",
    run({ world }) {
      for (const [group, level] of Object.entries(levels)) {
        world.lightLevels.set(group, level);
      }
    },
  };
}

/** A quick lift in the house lights: a moment of warmth after a good line. */
export const houseLift = lights("house-lift", { house: 1 });

/** The opposite: the room dims while the speaker dies inside. */
export const houseDip = lights("house-dip", { house: 0.35 });

/** Not real audio yet: there is no audio system. Logs so wiring can be tested. */
export const applause: EffectDef = {
  id: "applause",
  kind: "audio",
  run({ verdict }) {
    if (verdict === "success") console.info("[effect] applause");
  },
};

export const awkwardSilence: EffectDef = {
  id: "awkward-silence",
  kind: "audio",
  run({ verdict }) {
    if (verdict === "failure") console.info("[effect] awkward silence");
  },
};

effects.register(houseLift.id, houseLift);
effects.register(houseDip.id, houseDip);
effects.register(applause.id, applause);
effects.register(awkwardSilence.id, awkwardSilence);
