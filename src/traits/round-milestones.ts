import { defineTrait } from "../core/trait.ts";
import { GameTimer } from "./game-timer.ts";

/** Emitted on the room each time the round passes a milestone fraction. */
export const ROUND_MILESTONE = "round-milestone";

export interface RoundMilestone {
  /** The fraction of the round that was crossed, e.g. 0.25. */
  readonly fraction: number;
  /** Round time when it was crossed, in seconds. */
  readonly atSeconds: number;
}

/**
 * Announces the round's progress at fixed fractions, once each. A frame can
 * step past a threshold, so this fires on crossing rather than on equality;
 * rewinding the clock (a restart) clears the fired set.
 */
export const RoundMilestones = defineTrait({
  name: "round-milestones",
  defaults: {
    /** Fractions of the round to announce, in order. */
    at: [0.25, 0.5, 0.75] as number[],
    /** Fractions already announced this round. */
    fired: [] as number[],
  },
  setup({ object, settings }) {
    if (!object.has(GameTimer)) throw new Error("RoundMilestones requires GameTimer");
    // Start where the clock is; milestones behind us are marked as already gone.
    let previous = object.settingsOf(GameTimer)!.elapsedSeconds;
    settings.fired = settings.at.filter(
      (fraction) => fraction * object.settingsOf(GameTimer)!.durationSeconds <= previous,
    );

    return {
      update() {
        const clock = object.settingsOf(GameTimer)!;
        const now = clock.elapsedSeconds;
        if (now < previous) settings.fired = [];
        const marks = settings.at.filter((f) => f > 0 && f < 1);
        for (const fraction of marks) {
          const mark = fraction * clock.durationSeconds;
          if (previous < mark && now >= mark && !settings.fired.includes(fraction)) {
            settings.fired.push(fraction);
            object.emit(ROUND_MILESTONE, {
              fraction,
              atSeconds: now,
            } satisfies RoundMilestone);
          }
        }
        previous = now;
      },
    };
  },
});

/** The clip id that belongs to a milestone fraction, if there is one. */
export function milestoneClip(fraction: number): string | null {
  if (fraction === 0.25) return "round/quarter";
  if (fraction === 0.5) return "round/half";
  if (fraction === 0.75) return "round/three-quarters";
  return null;
}
