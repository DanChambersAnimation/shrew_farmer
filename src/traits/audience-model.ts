import type { AudienceAppearance } from "../characters/audience.ts";
import { type FaceRhythm, animateFace } from "../characters/audience-face-model.ts";
import type { MemoryEntry } from "../characters/crowd.ts";
import {
  audienceVisual,
  clampAudienceState,
  type AudiencePersonality,
  type AudienceState,
} from "../characters/audience-model.ts";
import { Random } from "../core/random.ts";
import { defineTrait } from "../core/trait.ts";
import { Inspectable, refreshInspection } from "./inspectable.ts";
import { PaperFigure } from "./paper-figure.ts";

/** Fixed timing and size for an individual's idle motion, in metres and seconds. */
export interface AudienceMotion {
  readonly amplitude: number;
  readonly period: number;
  readonly phase: number;
  readonly tremorHz: number;
}

export function randomAudienceMotion(seed: number): AudienceMotion {
  const rng = new Random(seed);
  return Object.freeze({
    amplitude: 0.015 + rng.next() * 0.01,
    period: 7.5 + rng.next() * 3,
    phase: rng.next() * Math.PI * 2,
    tremorHz: 4 + rng.next() * 3,
  });
}

/** Inner state is mutable; appearance is the person's fixed visual identity. */
export const AudienceModel = defineTrait({
  name: "audience-model",
  defaults: {
    appearance: { slots: {}, params: {} } as AudienceAppearance,
    personality: {
      gullibility: 0.5,
      intelligence: 0.5,
      superstition: 0.5,
      forgiveness: 0.5,
      sociability: 0.5,
    } as AudiencePersonality,
    state: { approval: 0, engagement: 0.5 } as AudienceState,
    motion: { amplitude: 0.02, period: 9, phase: 0, tremorHz: 5 } as AudienceMotion,
    /** The moves that reached this person this round, oldest first. */
    memory: [] as MemoryEntry[],
    /** Per-person blink, breathing and drool timing. */
    face: {
      blinkEvery: 3.4,
      blinkFor: 0.12,
      twitchEvery: 11,
      breathEvery: 4.2,
      droolAfter: 5,
      bubbleAfter: 8,
    } as FaceRhythm,
    /** Varies the blink and speaking pattern between people. */
    faceSeed: 1,
  },
  setup({ object, settings }) {
    const figure = object.settingsOf(PaperFigure);
    if (!figure) throw new Error("AudienceModel requires PaperFigure");
    let lastVisual = "";
    let elapsed = 0;
    const face = animateFace(settings.face, settings.faceSeed);
    const baseX = object.node.position.x;
    const baseY = object.node.position.y;
    const sync = (faceParts = face.parts) => {
      clampAudienceState(settings.state);
      const visual = audienceVisual(settings.state);
      const key = `${Object.values(faceParts).join("/")}/${visual.arms}`;
      if (key === lastVisual) return;
      lastVisual = key;
      figure.slots = { ...settings.appearance.slots, ...faceParts, arms: visual.arms };
      figure.params = settings.appearance.params;
      const inspect = object.settingsOf(Inspectable);
      if (inspect) {
        inspect.description = visual.description;
        refreshInspection(object);
      }
    };
    sync();
    return {
      update(dt) {
        elapsed += dt;
        sync(face.update(dt, settings.state));
        const { amplitude, period, phase, tremorHz } = settings.motion;
        const cycle = (Math.PI * 2 * elapsed) / period + phase;
        const rage =
          Math.max(0, Math.min(1, (-settings.state.approval - 0.4) / 0.6)) *
          Math.max(0, Math.min(1, (settings.state.engagement - 0.35) / 0.65));
        const tremor = rage * 0.004 * Math.sin(Math.PI * 2 * tremorHz * elapsed + phase);
        object.node.position.x = baseX + amplitude * Math.sin(cycle) + tremor;
        object.node.position.y = baseY + amplitude * 0.15 * Math.sin(cycle * 2 + phase);
      },
    };
  },
});
