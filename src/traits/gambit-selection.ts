import type { GameObject } from "../core/game-object.ts";
import { defineTrait } from "../core/trait.ts";
import { chooseHand, excluding, itemPool, RACK_SIZE } from "../gambits/draw.ts";
import { Gambits, isSpent } from "./gambits.ts";

/** Emitted on the room when a burned gambit is swapped for a fresh one. */
export const GAMBIT_REPLACED = "gambit-replaced";

export interface GambitReplaced {
  /** The spent gambit that burned away, if one did. */
  readonly retired: string | null;
  /** The fresh gambit drawn to fill the row, or null when the pool was dry. */
  readonly replacement: string | null;
  /** The hand after the change. */
  readonly hand: readonly string[];
}

/**
 * Fills the round's hand and keeps it full. The Gambits trait decides what is
 * playable; this trait decides what is offered, so a room can be given a fixed
 * hand or a randomly drawn one without changing either.
 */
export const GambitSelection = defineTrait({
  name: "gambit-selection",
  defaults: {
    /** Fixed ids to offer instead of drawing, in display order. Empty means draw. */
    hand: [] as string[],
    /** How many to draw when `hand` is empty. */
    count: RACK_SIZE,
    /** Seed for the draw, so a seeded round offers the same rack. */
    seed: 0,
    /** When true a random seed is picked each time the room opens. */
    random: true,
    /** When true a burned gambit is replaced so the hand stays full. */
    refill: true,
    /** The row size to keep topped up; 0 means the size the hand started with. */
    keep: 0,
  },
  setup({ object, settings }) {
    const gambits = object.settingsOf(Gambits);
    if (!gambits) throw new Error("GambitSelection requires Gambits on the same object");
    gambits.hand =
      settings.hand.length > 0
        ? [...settings.hand]
        : chooseHand(itemPool(), seedFor(settings), settings.count);
    settings.keep = gambits.hand.length;
  },
  update({ object, settings }) {
    if (!settings.refill) return;
    refillHand(object, settings.keep);
  },
});

function seedFor(settings: { readonly random: boolean; readonly seed: number }): number {
  return settings.random ? Math.floor(Math.random() * 0x100000000) : settings.seed;
}

/**
 * Keep the hand full. A burned gambit is removed from the hand by playGambit,
 * so this tops the row back up to `count` with gambits that are neither still
 * in hand nor already used this round. When the pool runs dry the row simply
 * gets shorter.
 */
export function refillHand(room: GameObject, count: number): readonly GambitReplaced[] {
  const gambits = room.settingsOf(Gambits);
  if (!gambits || gambits.finished) return [];

  // Clear out anything already spent that is somehow still sitting in the row.
  const spent = [...gambits.hand].filter((id) => isSpent(room, id));
  for (const id of spent) {
    gambits.hand = gambits.hand.filter((held) => held !== id);
    const swap: GambitReplaced = { retired: id, replacement: null, hand: [...gambits.hand] };
    room.emit(GAMBIT_REPLACED, swap);
  }

  const swaps: GambitReplaced[] = [];
  while (gambits.hand.length < count) {
    const replacement = drawReplacement(gambits.hand, gambits.played);
    if (!replacement) break;
    const next = [...gambits.hand, replacement];
    gambits.hand = next;
    const swap: GambitReplaced = { retired: null, replacement, hand: [...next] };
    swaps.push(swap);
    room.emit(GAMBIT_REPLACED, swap);
  }
  return [...swaps];
}

/** One fresh gambit id, or null when nothing untouched is left to offer. */
function drawReplacement(hand: readonly string[], played: readonly string[]): string | null {
  const fresh = excluding([...hand, ...played]);
  if (fresh.length === 0) return null;
  const [id] = chooseHand(fresh, Math.floor(Math.random() * 0x100000000), 1);
  return id ?? null;
}
