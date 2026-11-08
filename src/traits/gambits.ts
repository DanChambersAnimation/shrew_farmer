import { defineTrait } from "../core/trait.ts";
import type { ItemDef } from "../gambits/effect.ts";
import { items } from "../gambits/library.ts";
import {
  evaluateGambitTraits,
  type GambitTraitStatus,
  type GambitUseContext,
} from "../gambits/traits.ts";
import type { GameObject } from "../core/game-object.ts";
import { GAME_TIMER_FINISHED, GameTimer } from "./game-timer.ts";

/** Emitted on the room whenever a gambit is used, including buildup uses. */
export const GAMBIT_USED = "gambit-used";
/** Emitted only when a use releases the gambit's simulation effect. */
export const GAMBIT_PLAYED = "gambit-played";

export interface GambitUsed {
  readonly item: ItemDef;
  readonly atSeconds: number;
  readonly uses: number;
  readonly triggered: boolean;
}

export interface GambitPlayed {
  readonly item: ItemDef;
  readonly atSeconds: number;
}

/**
 * The round's hand and use history. Registered traits on each item decide its
 * cooldown, use limit and effect buildup. The round clock also gates all uses.
 */
export const Gambits = defineTrait({
  name: "gambits",
  defaults: {
    /** Ids of the gambits in hand, in display order. */
    hand: [] as string[],
    /** One id for every accepted use, including buildup uses. */
    played: [] as string[],
    /** Round time of the most recent accepted use of each gambit. */
    lastUsedAt: {} as Record<string, number>,
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

/** The use history a gambit's traits are evaluated against at this round time. */
export function useContextFor(room: GameObject, id: string): GambitUseContext {
  const hand = room.settingsOf(Gambits);
  const atSeconds = room.settingsOf(GameTimer)?.elapsedSeconds ?? 0;
  return {
    atSeconds,
    uses: hand?.played.filter((playedId) => playedId === id).length ?? 0,
    lastUsedAt: hand?.lastUsedAt[id],
  };
}

/** Whether an exhausted gambit has finished cooling and should leave the row. */
export function isSpent(
  room: GameObject,
  id: string,
  atSeconds = room.settingsOf(GameTimer)?.elapsedSeconds ?? 0,
): boolean {
  if (!room.settingsOf(Gambits) || !items.has(id)) return true;
  const status = gambitStatus(room, id, atSeconds);
  return status === null || (status.exhausted && status.cooldown === null);
}

/** Read all of an item's registered traits against its round use history. */
export function gambitStatus(
  room: GameObject,
  id: string,
  atSeconds = room.settingsOf(GameTimer)?.elapsedSeconds ?? 0,
): GambitTraitStatus | null {
  const hand = room.settingsOf(Gambits);
  if (!hand || !items.has(id)) return null;
  return evaluateGambitTraits(items.get(id).gambitTraits, {
    atSeconds,
    uses: hand.played.filter((playedId) => playedId === id).length,
    lastUsedAt: hand.lastUsedAt[id],
  });
}

/** Whether a gambit in `hand` can be used at this round time. */
export function canPlay(
  room: GameObject,
  id: string,
  atSeconds = room.settingsOf(GameTimer)?.elapsedSeconds ?? 0,
): boolean {
  const hand = room.settingsOf(Gambits);
  if (!hand || hand.finished || !hand.hand.includes(id) || !items.has(id)) return false;
  return gambitStatus(room, id, atSeconds)?.canUse ?? false;
}

/**
 * Accept a use and record it. BuildUp decides whether this use releases the
 * simulation effect; LimitedUse removes the item after any final cooldown.
 */
export function playGambit(room: GameObject, item: ItemDef, atSeconds: number): boolean {
  if (!canPlay(room, item.id, atSeconds)) return false;
  const hand = room.settingsOf(Gambits)!;
  hand.played = [...hand.played, item.id];
  hand.lastUsedAt[item.id] = atSeconds;
  const uses = hand.played.filter((id) => id === item.id).length;
  const status = gambitStatus(room, item.id, atSeconds)!;
  const triggered = status.effectReady;
  if (isSpent(room, item.id, atSeconds)) {
    hand.hand = hand.hand.filter((id) => id !== item.id);
  }
  room.emit(GAMBIT_USED, {
    item,
    atSeconds,
    uses,
    triggered,
  } satisfies GambitUsed);
  if (triggered) room.emit(GAMBIT_PLAYED, { item, atSeconds } satisfies GambitPlayed);
  return true;
}
