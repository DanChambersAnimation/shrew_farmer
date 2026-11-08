import { describe, expect, it } from "vite-plus/test";
import { rooms } from "../core/room-registry.ts";
import { World } from "../core/world.ts";
import { items } from "../gambits/library.ts";
import type { ItemDef } from "../gambits/effect.ts";
import { Gambits, canPlay, playGambit } from "../traits/gambits.ts";
import { GAMBIT_REPLACED, GambitSelection } from "../traits/gambit-selection.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { RACK_SIZE, chooseHand, sampleHand } from "./draw.ts";

import.meta.glob(["../rooms/*.ts", "!../rooms/*.test.ts"], { eager: true });
import "../effects/library.ts";

const pool: ItemDef[] = items.names().map((id) => items.get(id));

describe("choosing the round's hand", () => {
  it("draws five distinct gambits, in a stable order for a seed", () => {
    const hand = chooseHand(pool, 7);
    expect(hand).toHaveLength(RACK_SIZE);
    expect(new Set(hand).size).toBe(RACK_SIZE);
    expect(chooseHand(pool, 7)).toEqual(hand);
    expect(hand.every((id) => items.has(id))).toBe(true);
  });

  it("varies between seeds, and never repeats a gambit within a hand", () => {
    const hands = Array.from({ length: 12 }, (_, seed) => chooseHand(pool, seed).join(","));
    expect(new Set(hands).size).toBeGreaterThan(1);
    for (let seed = 0; seed < 12; seed++) {
      const hand = chooseHand(pool, seed);
      expect(new Set(hand).size).toBe(hand.length);
    }
  });

  it("asks for no more than the pool holds", () => {
    const small = pool.slice(0, 2);
    expect(chooseHand(small, 1)).toHaveLength(2);
    expect(sampleHand()).toHaveLength(Math.min(RACK_SIZE, pool.length));
  });
});

describe("GambitSelection", () => {
  const room = (settings: Record<string, unknown> = {}) => {
    const world = new World();
    const root = world.createRoot("room");
    root.add(GameTimer);
    root.add(Gambits, { hand: [], played: [], lastUsedAt: {}, finished: false });
    root.add(GambitSelection, settings);
    return root;
  };

  it("fills the hand with a fixed list when one is given", () => {
    const root = room({ hand: ["praise-jesus", "personal-anecdote"], random: false });
    expect(root.settingsOf(Gambits)!.hand).toEqual(["praise-jesus", "personal-anecdote"]);
  });

  it("draws the requested number, and the same draw for the same seed", () => {
    const seeded = room({ count: 4, seed: 42, random: false });
    const again = room({ count: 4, seed: 42, random: false });
    expect(seeded.settingsOf(Gambits)!.hand).toHaveLength(4);
    expect(again.settingsOf(Gambits)!.hand).toEqual(seeded.settingsOf(Gambits)!.hand);
  });

  it("draws a different hand for a different seed, and on each random round", () => {
    const a = room({ seed: 1, random: false }).settingsOf(Gambits)!.hand.join(",");
    const b = room({ seed: 2, random: false }).settingsOf(Gambits)!.hand.join(",");
    expect(a).not.toBe(b);
    const draws = new Set(
      Array.from({ length: 10 }, () => room({ random: true }).settingsOf(Gambits)!.hand.join(",")),
    );
    expect(draws.size).toBeGreaterThan(1);
  });

  it("refuses to work without the Gambits trait beside it", () => {
    const world = new World();
    const root = world.createRoot("room");
    expect(() => root.add(GambitSelection)).toThrow("requires Gambits");
  });
});

describe("replacing a burned gambit", () => {
  const room = (hand: string[], refill = true) => {
    const world = new World();
    const root = world.createRoot("room");
    root.add(GameTimer);
    root.add(Gambits, { hand: [...hand], played: [], lastUsedAt: {}, finished: false });
    root.add(GambitSelection, { hand, refill, random: false });
    return root;
  };

  it("swaps a burned gambit for a fresh one from the pool", () => {
    const root = room(["praise-jesus", "personal-anecdote"]);
    const swaps: unknown[] = [];
    root.on(GAMBIT_REPLACED, (payload) => swaps.push(payload));

    playGambit(root, items.get("praise-jesus"), 0);
    root.update(0);

    const hand = root.settingsOf(Gambits)!.hand;
    // The row keeps its size, drops the burned gambit, and gains a fresh one.
    expect(hand).toHaveLength(2);
    expect(hand).not.toContain("praise-jesus");
    expect(hand).toContain("personal-anecdote");
    // The burned gambit had already left the row, so this event is a top-up.
    expect(swaps).toHaveLength(1);
    expect((swaps[0] as { retired: string | null }).retired).toBeNull();
    expect((swaps[0] as { replacement: string }).replacement).not.toBe("praise-jesus");
  });

  it("never offers a gambit that is already in the hand or already retired", () => {
    const root = room(["praise-jesus", "personal-anecdote"]);
    playGambit(root, items.get("praise-jesus"), 0);
    root.update(0);
    const hand = root.settingsOf(Gambits)!.hand;
    expect(new Set(hand).size).toBe(hand.length);
    expect(hand).not.toContain("praise-jesus");
  });

  it("keeps drawing until the pool runs dry, then the row shrinks", () => {
    const root = room(["praise-jesus", "anecdote-callback", "t-shirt-cannon"]);
    expect(root.settingsOf(Gambits)!.hand).toHaveLength(3);
    for (const id of ["praise-jesus", "anecdote-callback", "t-shirt-cannon"]) {
      playGambit(root, items.get(id), 0);
      root.update(0);
    }
    const hand = root.settingsOf(Gambits)!.hand;
    expect(new Set(hand).size).toBe(hand.length);
    // Every finite item is either spent or replaced by an unused one.
    for (const id of hand) expect(canPlay(root, id, 5)).toBe(true);
  });

  it("leaves the row alone when refill is off", () => {
    const root = room(["praise-jesus"], false);
    playGambit(root, items.get("praise-jesus"), 0);
    root.update(0);
    expect(root.settingsOf(Gambits)!.hand).toEqual([]);
  });
});

describe("the rack in a room", () => {
  it("gives dev3 a hand of gambits that can be played", () => {
    const world = new World();
    const room = rooms.load(world, "dev3");
    const hand = room.settingsOf(Gambits)!.hand;
    expect(hand).toHaveLength(RACK_SIZE);
    for (const id of hand) expect(canPlay(room, id, 0)).toBe(true);
  });

  it("spends a limited-use gambit so it leaves the row", () => {
    const world = new World();
    const room = world.createRoot("room");
    room.add(GameTimer);
    room.add(Gambits, { hand: ["praise-jesus"], played: [], lastUsedAt: {}, finished: false });
    expect(canPlay(room, "praise-jesus", 0)).toBe(true);
    expect(playGambit(room, items.get("praise-jesus"), 0)).toBe(true);
    expect(room.settingsOf(Gambits)!.hand).toEqual([]);
    expect(canPlay(room, "praise-jesus", 5)).toBe(false);
    expect(playGambit(room, items.get("praise-jesus"), 5)).toBe(false);
  });

  it("keeps a cooldown gambit in the row, but makes it wait", () => {
    const world = new World();
    const room = world.createRoot("room");
    room.add(GameTimer);
    room.add(Gambits, { hand: ["personal-anecdote"], played: [], lastUsedAt: {}, finished: false });
    expect(playGambit(room, items.get("personal-anecdote"), 0)).toBe(true);
    // Still in the row, just unavailable until its cooldown elapses.
    expect(room.settingsOf(Gambits)!.hand).toEqual(["personal-anecdote"]);
    expect(canPlay(room, "personal-anecdote", 5)).toBe(false);
    expect(canPlay(room, "personal-anecdote", 15)).toBe(true);
  });

  it("closes the hand when the round clock stops", () => {
    const world = new World();
    const room = rooms.load(world, "dev3");
    const id = room.settingsOf(Gambits)!.hand[0]!;
    world.update(room.settingsOf(GameTimer)!.durationSeconds);
    expect(room.settingsOf(Gambits)!.finished).toBe(true);
    expect(canPlay(room, id, 60)).toBe(false);
  });
});
