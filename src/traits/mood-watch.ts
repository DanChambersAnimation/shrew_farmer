import type { GameObject } from "../core/game-object.ts";
import { defineTrait } from "../core/trait.ts";
import { type Mood, VALENCE, moodOf } from "../characters/mood.ts";
import { AudienceModel } from "./audience-model.ts";

/** World event: an audience member's mood band changed. */
export const MOOD_CHANGED = "mood-changed";

export interface MoodChange {
  readonly who: GameObject;
  readonly from: Mood;
  readonly to: Mood;
  /** How big the swing is, by valence (always positive). */
  readonly size: number;
}

/**
 * Watches an audience member's state and announces (MOOD_CHANGED, on the
 * world) when their mood band changes. A new mood must hold for `settle`
 * seconds first, so flicker at a band's edge doesn't count.
 */
export const MoodWatch = defineTrait({
  name: "mood-watch",
  defaults: { settle: 0.4 },
  setup({ object, world, settings: s }) {
    const model = object.settingsOf(AudienceModel);
    if (!model) throw new Error(`MoodWatch needs AudienceModel on "${object.kind}"`);
    let mood = moodOf(model.state);
    let pending: Mood | null = null;
    let held = 0;
    return {
      update(dt) {
        const now = moodOf(model.state);
        if (now === mood) {
          pending = null;
          return;
        }
        if (now !== pending) {
          pending = now;
          held = 0;
        }
        held += dt;
        if (held < s.settle) return;
        const change: MoodChange = {
          who: object,
          from: mood,
          to: now,
          size: Math.abs(VALENCE[now] - VALENCE[mood]),
        };
        mood = now;
        pending = null;
        world.events.emit(MOOD_CHANGED, change);
      },
    };
  },
});
