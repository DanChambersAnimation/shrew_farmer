import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { anecdoteCallback, personalAnecdote } from "../gambits/items/anecdote.ts";
import { piousStatement, ruleOfThree } from "../gambits/items/rhetoric.ts";
import { GameTimer } from "./game-timer.ts";
import { GAMBIT_PLAYED, GAMBIT_USED, Gambits, canPlay, playGambit } from "./gambits.ts";

function roomWithHand(hand: string[] = [personalAnecdote.id, anecdoteCallback.id]) {
  const world = new World();
  const room = world.createRoot("room");
  room.add(GameTimer);
  room.add(Gambits, { hand, played: [], finished: false });
  return { world, room };
}

describe("Gambits", () => {
  it("takes an exhausted gambit out of the hand so it cannot be played twice", () => {
    const { room } = roomWithHand([anecdoteCallback.id]);
    const played: unknown[] = [];
    room.on(GAMBIT_PLAYED, (payload) => played.push(payload));

    expect(canPlay(room, anecdoteCallback.id)).toBe(true);
    expect(playGambit(room, anecdoteCallback, 3)).toBe(true);
    expect(played).toEqual([{ item: anecdoteCallback, atSeconds: 3 }]);

    const hand = room.settingsOf(Gambits)!;
    expect(hand.hand).toEqual([]);
    expect(hand.played).toEqual([anecdoteCallback.id]);
    expect(canPlay(room, anecdoteCallback.id)).toBe(false);
    expect(playGambit(room, anecdoteCallback, 4)).toBe(false);
  });

  it("refuses a gambit that was never in the hand", () => {
    const { room } = roomWithHand([anecdoteCallback.id]);
    expect(playGambit(room, personalAnecdote, 1)).toBe(false);
    expect(room.settingsOf(Gambits)!.played).toEqual([]);
  });

  it("builds the rule of three over three uses before releasing its effect", () => {
    const { room } = roomWithHand([ruleOfThree.id]);
    const used: unknown[] = [];
    const played: unknown[] = [];
    room.on(GAMBIT_USED, (event) => used.push(event));
    room.on(GAMBIT_PLAYED, (event) => played.push(event));
    expect(playGambit(room, ruleOfThree, 1)).toBe(true);
    expect(playGambit(room, ruleOfThree, 2)).toBe(true);
    expect(played).toHaveLength(0);
    expect(canPlay(room, ruleOfThree.id, 2)).toBe(true);
    expect(playGambit(room, ruleOfThree, 3)).toBe(true);
    expect(played).toEqual([{ item: ruleOfThree, atSeconds: 3 }]);
    expect(used).toMatchObject([
      { uses: 1, triggered: false },
      { uses: 2, triggered: false },
      { uses: 3, triggered: true },
    ]);
    expect(room.settingsOf(Gambits)!.hand).toEqual([]);
  });

  it("keeps a reusable gambit in hand but enforces its cooldown", () => {
    const { room } = roomWithHand([piousStatement.id]);
    expect(playGambit(room, piousStatement, 0)).toBe(true);
    expect(canPlay(room, piousStatement.id, 11.99)).toBe(false);
    expect(playGambit(room, piousStatement, 11.99)).toBe(false);
    expect(playGambit(room, piousStatement, 12)).toBe(true);
    expect(room.settingsOf(Gambits)!.hand).toEqual([piousStatement.id]);
    expect(room.settingsOf(Gambits)!.played).toEqual([piousStatement.id, piousStatement.id]);
  });

  it("refuses everything once the round clock has stopped", () => {
    const { world, room } = roomWithHand();
    world.update(60);
    expect(room.settingsOf(GameTimer)!.running).toBe(false);
    expect(room.settingsOf(Gambits)!.finished).toBe(true);
    expect(canPlay(room, personalAnecdote.id)).toBe(false);
    expect(playGambit(room, personalAnecdote, 60)).toBe(false);
    expect(room.settingsOf(Gambits)!.hand).toHaveLength(2);
  });
});
