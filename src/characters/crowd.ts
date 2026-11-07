import {
  clampAudienceState,
  type AudiencePersonality,
  type AudienceState,
} from "./audience-model.ts";

/** One move that reached this person, and the round time it landed at (seconds). */
export interface MemoryEntry {
  readonly id: string;
  readonly atSeconds: number;
}

/** Someone at the next seat, and how strongly their mood carries (0 = not at all). */
export interface Neighbour {
  readonly state: Readonly<AudienceState>;
  weight: number;
}

/** How the crowd behaves when nothing is played. All values are per tick. */
export interface DriftRates {
  /** Engagement lost each tick that no gambit lands on this person. */
  readonly boredom: number;
  /** How far engagement is pulled toward the louder neighbours. */
  readonly neighbourEngagement: number;
  /** How far approval is pulled toward the louder neighbours. */
  readonly neighbourApproval: number;
}

export const DRIFT: DriftRates = Object.freeze({
  boredom: 0.02,
  neighbourEngagement: 0.3,
  neighbourApproval: 0.2,
});

/**
 * One second of the crowd for a single person: boredom with no attention from
 * the stage, then a pull toward the neighbours whose mood carries, scaled by
 * sociability. A sociability of 0 leaves the person untouched by anyone else.
 */
export function driftAudienceState(
  state: AudienceState,
  personality: Readonly<AudiencePersonality>,
  neighbours: readonly Neighbour[],
  rates: DriftRates = DRIFT,
): void {
  state.engagement -= rates.boredom;

  const carrying = neighbours.filter((n) => n.weight > 0);
  const weight = carrying.reduce((total, n) => total + n.weight, 0);
  if (weight > 0) {
    const mean = (read: (state: Readonly<AudienceState>) => number) =>
      carrying.reduce((total, n) => total + read(n.state) * n.weight, 0) / weight;
    // Even a whole room of loud neighbours can only pull someone so far in a second.
    const pull = Math.min(1, weight * personality.sociability);
    state.engagement +=
      (mean((s) => s.engagement) - state.engagement) * rates.neighbourEngagement * pull;
    state.approval += (mean((s) => s.approval) - state.approval) * rates.neighbourApproval * pull;
  }

  clampAudienceState(state);
}
