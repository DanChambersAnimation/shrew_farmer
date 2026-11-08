import type { AudienceState } from "./audience-model.ts";

/** Named bands of an audience member's state, from best to worst. */
export const MOODS = [
  "ecstatic",
  "delighted",
  "interested",
  "neutral",
  "bored",
  "asleep",
  "sceptical",
  "hostile",
] as const;

export type Mood = (typeof MOODS)[number];

/** How good a mood is for the Speaker: positive is good, negative bad. */
export const VALENCE: Record<Mood, number> = {
  ecstatic: 3,
  delighted: 2,
  interested: 1,
  neutral: 0,
  bored: -1,
  asleep: -1.5,
  sceptical: -1.5,
  hostile: -3,
};

/** Which mood band a state falls in. Disengagement wins over opinion. */
export function moodOf({ approval, engagement }: Readonly<AudienceState>): Mood {
  if (engagement < 0.15) return "asleep";
  if (engagement < 0.4) return "bored";
  if (approval <= -0.6) return "hostile";
  if (approval <= -0.25) return "sceptical";
  if (approval >= 0.75 && engagement >= 0.8) return "ecstatic";
  if (approval >= 0.5) return "delighted";
  if (approval >= 0.2 || engagement >= 0.8) return "interested";
  return "neutral";
}

/** A state squarely inside each mood, e.g. for nudging someone into it. */
export const TYPICAL_STATE: Record<Mood, AudienceState> = {
  ecstatic: { approval: 0.9, engagement: 0.95 },
  delighted: { approval: 0.6, engagement: 0.7 },
  interested: { approval: 0.3, engagement: 0.7 },
  neutral: { approval: 0, engagement: 0.6 },
  bored: { approval: 0, engagement: 0.3 },
  asleep: { approval: 0, engagement: 0.05 },
  sceptical: { approval: -0.4, engagement: 0.6 },
  hostile: { approval: -0.85, engagement: 0.75 },
};
