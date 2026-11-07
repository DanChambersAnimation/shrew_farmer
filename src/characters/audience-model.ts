import { ARMS } from "./audience.ts";
import { Random } from "../core/random.ts";

/** Stable predispositions, independent of the person's appearance. Values are 0 to 1. */
export interface AudiencePersonality {
  readonly gullibility: number;
  readonly intelligence: number;
  readonly superstition: number;
  readonly forgiveness: number;
  readonly sociability: number;
}

/** Most people are near the middle; extremes are uncommon. */
export function randomPersonality(seed: number): AudiencePersonality {
  const rng = new Random(seed);
  const trait = () => Math.max(0, Math.min(1, rng.normal(0.5, 0.17)));
  return Object.freeze({
    gullibility: trait(),
    intelligence: trait(),
    superstition: trait(),
    forgiveness: trait(),
    sociability: trait(),
  });
}

/** Approval is -1 (disapproving) to 1 (approving); engagement is 0 to 1. */
export interface AudienceState {
  approval: number;
  engagement: number;
}

export function randomAudienceState(seed: number): AudienceState {
  const rng = new Random(seed);
  // People usually arrive paying attention; a tenth of them start bored or rapt.
  const engagement = Math.max(0, Math.min(1, rng.normal(0.65, 0.1)));
  return { approval: rng.next() * 2 - 1, engagement };
}

export function clampAudienceState(state: AudienceState): void {
  state.approval = Math.max(-1, Math.min(1, state.approval));
  state.engagement = Math.max(0, Math.min(1, state.engagement));
}

/**
 * Project inner state onto arms and a description. The face is left to
 * `faceFor` in audience-face-model.ts, which splits it into drivable parts.
 */
export function audienceVisual(state: Readonly<AudienceState>): {
  arms: keyof typeof ARMS;
  description: string;
} {
  const { approval, engagement } = state;
  if (engagement < 0.15) return { arms: "lap", description: "Nodding off." };
  if (engagement < 0.4) return { arms: "phone", description: "Distracted by their phone." };
  if (approval <= -0.55)
    return { arms: "crossed", description: "Watching closely, but unconvinced." };
  if (approval >= 0.75) {
    return {
      arms: engagement >= 0.8 ? "cheer" : "clap",
      description: "Enjoying the talk.",
    };
  }
  if (approval >= 0.3) return { arms: "lap", description: "Listening with interest." };
  if (approval <= -0.25) return { arms: "lap", description: "Listening with reservations." };
  return engagement >= 0.8
    ? { arms: "chin", description: "Watching intently." }
    : { arms: "lap", description: "Listening." };
}
