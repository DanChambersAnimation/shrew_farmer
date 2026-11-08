import { Random } from "../core/random.ts";
import { defineTrait } from "../core/trait.ts";

/** A fixed voice for each seated person; separate from mood and personality. */
export const AUDIENCE_VOICES = ["Sarah", "Charlie", "Harry", "Matilda"] as const;
export type AudienceVoiceName = (typeof AUDIENCE_VOICES)[number];

export function audienceVoiceFor(seed: number): AudienceVoiceName {
  return new Random(seed ^ 0x6a8fba97).pick(AUDIENCE_VOICES);
}

export const AudienceVoice = defineTrait({
  name: "audience-voice",
  defaults: { voiceName: "Sarah" as AudienceVoiceName },
});
