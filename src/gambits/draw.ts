import { Random } from "../core/random.ts";
import type { ItemDef } from "./effect.ts";
import { items } from "./library.ts";

/** How many gambits a round's hand holds by default. */
export const RACK_SIZE = 5;

/**
 * Choose a hand: `count` gambits drawn without replacement, in a stable order
 * for a given seed so a seeded round always offers the same rack.
 */
export function chooseHand(pool: readonly ItemDef[], seed: number, count = RACK_SIZE): string[] {
  const rng = new Random(seed);
  const remaining = pool.map((item) => item.id);
  const target = Math.min(count, remaining.length);
  const hand: string[] = [];
  while (hand.length < target) {
    // Draw without replacement; clamped so a roll can never come up out of range.
    const index = Math.min(remaining.length - 1, Math.floor(rng.next() * remaining.length));
    hand.push(remaining.splice(index, 1)[0]!);
  }
  return hand;
}

/** A hand drawn at random from every registered item. */
export function sampleHand(count = RACK_SIZE, seed = Math.floor(Math.random() * 0x100000000)) {
  return chooseHand(itemPool(), seed, count);
}

/** Every registered item that has something to simulate. */
export function itemPool(): ItemDef[] {
  return items
    .names()
    .map((id) => items.get(id))
    .filter((item) => item.simulation.outcomes.length > 0);
}

/** Pool entries whose ids are not in `exclude`, so a draw never repeats a card. */
export function excluding(exclude: readonly string[]): ItemDef[] {
  const blocked = new Set(exclude);
  return itemPool().filter((item) => !blocked.has(item.id));
}
