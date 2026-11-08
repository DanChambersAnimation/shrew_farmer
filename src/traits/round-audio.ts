import { playGameLost, playGetReady } from "../audio/cues.ts";
import { playRecorded, resetReactions } from "../audio/player.ts";
import { defineTrait } from "../core/trait.ts";
import { ROUND_MILESTONE, type RoundMilestone, milestoneClip } from "./round-milestones.ts";
import { AudienceModel } from "./audience-model.ts";
import { GameTimer } from "./game-timer.ts";
import { Seat } from "./seat.ts";

/** Emitted when the player starts a round through the Start Round action. */
export const ROUND_STARTED = "round-started";
/** Emitted once at the end if a strict majority of the audience is disengaged. */
export const ROUND_LOST = "round-lost";
/** Emitted once at the end when the round survived, with whether it triumphed. */
export const ROUND_ENDED = "round-ended";

export interface RoundEnded {
  readonly triumphed: boolean;
  readonly meanApproval: number;
}

export function majorityDisengaged(engagements: readonly number[], disengagedBelow = 0.4): boolean {
  return (
    engagements.length > 0 &&
    engagements.filter((engagement) => engagement < disengagedBelow).length > engagements.length / 2
  );
}

/**
 * The round's own sounds: the start, the Speaker's lines at each milestone, and
 * an ending that depends on how the crowd felt. Recorded clips carry it; the
 * synthesised cues stay for the moments that want a clean tone.
 */
export const RoundAudio = defineTrait({
  name: "round-audio",
  defaults: {
    disengagedBelow: 0.4,
    /** Mean approval at or above which a surviving round counts as a triumph. */
    triumphedAbove: 0.35,
  },
  setup({ object, settings }) {
    if (!object.has(GameTimer)) throw new Error("RoundAudio requires GameTimer");
    const stopListening = object.on(ROUND_STARTED, () => {
      playGetReady();
      playRecorded("speaker/round-start");
      resetReactions();
    });
    const stopMilestones = object.on(ROUND_MILESTONE, (payload) => {
      const { fraction } = payload as RoundMilestone;
      const clip = milestoneClip(fraction);
      if (clip) playRecorded(clip);
    });
    let judged = false;
    return {
      update() {
        const clock = object.settingsOf(GameTimer)!;
        if (judged || clock.running || clock.elapsedSeconds < clock.durationSeconds) return;
        judged = true;
        const states = [...object.descendants()]
          .filter((person) => person.has(AudienceModel) && person.parent?.has(Seat))
          .map((person) => person.settingsOf(AudienceModel)!.state);
        const engagements = states.map((state) => state.engagement);
        if (majorityDisengaged(engagements, settings.disengagedBelow)) {
          object.emit(ROUND_LOST);
          playGameLost();
          playRecorded("speaker/round-lost");
          playRecorded("round/lost");
          return;
        }
        // Survived, but did the room love it? Mean approval decides.
        const mean =
          states.length === 0 ? 0 : states.reduce((sum, s) => sum + s.approval, 0) / states.length;
        const triumphed = mean >= settings.triumphedAbove;
        object.emit(ROUND_ENDED, { triumphed, meanApproval: mean });
        playRecorded(triumphed ? "speaker/round-won" : "speaker/round-lost");
        playRecorded(triumphed ? "round/won" : "round/lost");
      },
      dispose() {
        stopListening();
        stopMilestones();
      },
    };
  },
});
