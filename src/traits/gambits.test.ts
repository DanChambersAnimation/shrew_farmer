import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { anecdoteCallback, personalAnecdote } from "../gambits/items/anecdote.ts";
import { GameTimer } from "./game-timer.ts";
import { GAMBIT_PLAYED, Gambits, canPlay, playGambit } from "./gambits.ts";

function roomWithHand(hand: string[] = [personalAnecdote.id, anecdoteCallback.id]) {
  const world = new World();
  const room = world.createRoot("room");
  room.add(GameTimer);
  room.add(Gambits, { hand, played: [], finished: false });
  return { world, room };
}

describe("Gambits", () => {
  it("takes a gambit out of the hand so it cannot be played twice", () => {
    const { room } = roomWithHand();
    const played: unknown[] = [];
    room.on(GAMBIT_PLAYED, (payload) => played.push(payload));

    expect(canPlay(room, personalAnecdote.id)).toBe(true);
    expect(playGambit(room, personalAnecdote, 3)).toBe(true);
    expect(played).toEqual([{ item: personalAnecdote, atSeconds: 3 }]);

    const hand = room.settingsOf(Gambits)!;
    expect(hand.hand).toEqual([anecdoteCallback.id]);
    expect(hand.played).toEqual([personalAnecdote.id]);
    expect(canPlay(room, personalAnecdote.id)).toBe(false);
    expect(playGambit(room, personalAnecdote, 4)).toBe(false);
  });

  it("refuses a gambit that was never in the hand", () => {
    const { room } = roomWithHand([anecdoteCallback.id]);
    expect(playGambit(room, personalAnecdote, 1)).toBe(false);
    expect(room.settingsOf(Gambits)!.played).toEqual([]);
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
