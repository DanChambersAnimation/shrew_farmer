import { defineTrait } from "../core/trait.ts";
import type { ItemDef } from "../gambits/effect.ts";
import { items } from "../gambits/library.ts";
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
 * The round's hand of gambits. Each definition decides its use limit, buildup
 * and cooldown. Nothing can be used after the round clock has stopped.
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

/** Whether a gambit in `hand` can be used at this round time. */
export function canPlay(
  room: GameObject,
  id: string,
  atSeconds = room.settingsOf(GameTimer)?.elapsedSeconds ?? 0,
): boolean {
  const hand = room.settingsOf(Gambits);
  if (!hand || hand.finished || !hand.hand.includes(id) || !items.has(id)) return false;
  const { maxUses, cooldownSeconds } = items.get(id).usage;
  const uses = hand.played.filter((playedId) => playedId === id).length;
  if (maxUses !== null && uses >= maxUses) return false;
  const lastUsedAt = hand.lastUsedAt[id];
  return lastUsedAt === undefined || atSeconds >= lastUsedAt + cooldownSeconds;
}

/**
 * Accept a use and record it. Every `usesPerEffect`th use emits GAMBIT_PLAYED;
 * intermediate uses emit GAMBIT_USED only. Returns false if unavailable.
 */
export function playGambit(room: GameObject, item: ItemDef, atSeconds: number): boolean {
  if (!canPlay(room, item.id, atSeconds)) return false;
  const hand = room.settingsOf(Gambits)!;
  hand.played = [...hand.played, item.id];
  hand.lastUsedAt[item.id] = atSeconds;
  const uses = hand.played.filter((id) => id === item.id).length;
  const triggered = uses % item.usage.usesPerEffect === 0;
  if (item.usage.maxUses !== null && uses >= item.usage.maxUses) {
    hand.hand = hand.hand.filter((id) => id !== item.id);
  }
  room.emit(GAMBIT_USED, { item, atSeconds, uses, triggered } satisfies GambitUsed);
  if (triggered) room.emit(GAMBIT_PLAYED, { item, atSeconds } satisfies GambitPlayed);
  return true;
}
