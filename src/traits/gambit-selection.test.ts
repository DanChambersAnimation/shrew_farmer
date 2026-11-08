import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { items } from "../gambits/library.ts";
import { Cooldown, LimitedUse, gambitTrait } from "../gambits/traits.ts";
import { RACK_SIZE } from "../gambits/draw.ts";
import { Gambits, canPlay, gambitStatus, isSpent, playGambit } from "./gambits.ts";
import { GAMBIT_REPLACED, GambitSelection } from "./gambit-selection.ts";
import { GameTimer } from "./game-timer.ts";

function room(hand: string[]) {
  const world = new World();
  const root = world.createRoot("room");
  root.add(GameTimer);
  root.add(Gambits);
  root.add(GambitSelection, { hand, random: false });
  return root;
}

describe("gambit replacement lifecycle", () => {
  it("tops a short playable rack up to five items by default", () => {
    const root = room(["personal-anecdote", "praise-jesus"]);
    const hand = root.settingsOf(Gambits)!.hand;
    expect(hand).toHaveLength(RACK_SIZE);
    expect(hand).toContain("personal-anecdote");
    expect(hand).toContain("praise-jesus");
    expect(new Set(hand).size).toBe(RACK_SIZE);
  });

  it("holds a used-up item in its slot until its final cooldown ends", () => {
    const id = "test-one-use-with-cooldown";
    items.register(id, {
      ...items.get("praise-jesus"),
      id,
      gambitTraits: [gambitTrait(LimitedUse, { count: 1 }), gambitTrait(Cooldown, { seconds: 5 })],
    });
    const root = room([id, "personal-anecdote"]);
    root.update(0);
    const originalHand = [...root.settingsOf(Gambits)!.hand];
    const replacements: unknown[] = [];
    root.on(GAMBIT_REPLACED, (event) => replacements.push(event));

    expect(playGambit(root, items.get(id), 0)).toBe(true);
    expect(canPlay(root, id, 0)).toBe(false);
    expect(isSpent(root, id)).toBe(false);
    expect(root.settingsOf(Gambits)!.hand).toEqual(originalHand);
    expect(gambitStatus(root, id)?.cooldown?.remainingSeconds).toBe(5);

    root.update(4);
    expect(root.settingsOf(Gambits)!.hand).toEqual(originalHand);
    expect(gambitStatus(root, id)?.cooldown?.remainingSeconds).toBe(1);
    expect(replacements).toHaveLength(0);

    root.update(1);
    const hand = root.settingsOf(Gambits)!.hand;
    expect(isSpent(root, id)).toBe(true);
    expect(canPlay(root, id)).toBe(false);
    expect(hand).toHaveLength(RACK_SIZE);
    expect(hand).not.toContain(id);
    expect(hand).toContain("personal-anecdote");
    expect(replacements).toHaveLength(2);
    expect(replacements[0]).toMatchObject({ retired: id, replacement: null });
    expect(replacements[1]).toMatchObject({ retired: null });
  });

  it("retires a one-use item without a cooldown immediately", () => {
    const root = room(["praise-jesus"]);
    expect(playGambit(root, items.get("praise-jesus"), 0)).toBe(true);
    expect(root.settingsOf(Gambits)!.hand).not.toContain("praise-jesus");
    root.update(0);
    expect(root.settingsOf(Gambits)!.hand).toHaveLength(RACK_SIZE);
  });
});
