import { playGameLost, playGetReady } from "../audio/cues.ts";
import { defineTrait } from "../core/trait.ts";
import { AudienceModel } from "./audience-model.ts";
import { GameTimer } from "./game-timer.ts";
import { Seat } from "./seat.ts";

/** Emitted when the player starts a round through the Start Round action. */
export const ROUND_STARTED = "round-started";
/** Emitted once at the end if a strict majority of the audience is disengaged. */
export const ROUND_LOST = "round-lost";

export function majorityDisengaged(engagements: readonly number[], disengagedBelow = 0.4): boolean {
  return (
    engagements.length > 0 &&
    engagements.filter((engagement) => engagement < disengagedBelow).length > engagements.length / 2
  );
}

/** Start cue and end-of-round loss cue for playable rooms. */
export const RoundAudio = defineTrait({
  name: "round-audio",
  defaults: { disengagedBelow: 0.4 },
  setup({ object, settings }) {
    if (!object.has(GameTimer)) throw new Error("RoundAudio requires GameTimer");
    const stopListening = object.on(ROUND_STARTED, () => playGetReady());
    let judged = false;
    return {
      update() {
        const clock = object.settingsOf(GameTimer)!;
        if (judged || clock.running || clock.elapsedSeconds < clock.durationSeconds) return;
        judged = true;
        const engagements = [...object.descendants()]
          .filter((person) => person.has(AudienceModel) && person.parent?.has(Seat))
          .map((person) => person.settingsOf(AudienceModel)!.state.engagement);
        if (majorityDisengaged(engagements, settings.disengagedBelow)) {
          object.emit(ROUND_LOST);
          playGameLost();
        }
      },
      dispose: stopListening,
    };
  },
});
