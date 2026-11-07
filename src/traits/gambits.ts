import { defineTrait } from "../core/trait.ts";
import type { ItemDef } from "../gambits/effect.ts";
import type { GameObject } from "../core/game-object.ts";
import { GAME_TIMER_FINISHED } from "./game-timer.ts";

/** Emitted on the room when a gambit is played, with the gambit and its round time. */
export const GAMBIT_PLAYED = "gambit-played";

export interface GambitPlayed {
  readonly item: ItemDef;
  readonly atSeconds: number;
}

/**
 * The round's hand of gambits. A gambit leaves the hand once played, so it
 * cannot be played again this round; a new round gets a fresh hand. Nothing can
 * be played after the round clock has stopped.
 */
export const Gambits = defineTrait({
  name: "gambits",
  defaults: {
    /** Ids of the gambits in hand, in display order. */
    hand: [] as string[],
    /** Ids already played this round. */
    played: [] as string[],
    /** Set when the round is over; no further gambit can be played. */
    finished: false,
  },
  setup({ object }) {
    // The clock may already be attached: listen for the round ending.
    object.on(GAME_TIMER_FINISHED, () => {
      const settings = object.settingsOf(Gambits);
      if (settings) settings.finished = true;
    });
  },
});

/** Whether a gambit in `hand` can be played right now. */
export function canPlay(room: GameObject, id: string): boolean {
  const hand = room.settingsOf(Gambits);
  if (!hand || hand.finished) return false;
  return hand.hand.includes(id) && !hand.played.includes(id);
}

/**
 * Play a gambit: it leaves the hand, is remembered as played, and the room is
 * told which gambit went off. Returns false if it could not be played.
 */
export function playGambit(room: GameObject, item: ItemDef, atSeconds: number): boolean {
  if (!canPlay(room, item.id)) return false;
  const hand = room.settingsOf(Gambits)!;
  hand.hand = hand.hand.filter((id) => id !== item.id);
  hand.played = [...hand.played, item.id];
  room.emit(GAMBIT_PLAYED, { item, atSeconds } satisfies GambitPlayed);
  return true;
}
