import { describe, expect, it } from "vite-plus/test";
import { items } from "../gambits/library.ts";
import { anecdoteCallback, personalAnecdote } from "../gambits/items/anecdote.ts";
import { piousStatement, praiseJesus, ruleOfThree } from "../gambits/items/rhetoric.ts";
import { tShirtCannon } from "../gambits/items/t-shirt-cannon.ts";
import { applyEffect, chooseOutcome, type ItemDef } from "../gambits/effect.ts";
import { effectsFor, judge, resolveItem, type CrowdMember } from "../gambits/resolve.ts";
import { World } from "../core/world.ts";
import { spawnSpec } from "../core/spec.ts";
import "../effects/library.ts";
import { Sign } from "../traits/sign.ts";
import { T_SHIRT_FIRED, TShirtBarrage } from "../traits/t-shirt-barrage.ts";

const scene = () => {
  const world = new World();
  return { world, room: world.createRoot("room") };
};

const personality = {
  gullibility: 0.5,
  intelligence: 0.5,
  superstition: 0.5,
  faithAffinity: 0.5,
  forgiveness: 0.5,
  sociability: 0.5,
};

function member(overrides: Partial<CrowdMember> = {}): CrowdMember {
  return {
    state: { approval: 0, engagement: 0.65 },
    personality,
    memory: [],
    position: [0, 0, 0],
    ...overrides,
  };
}

describe("gambit registry", () => {
  it("registers the gambits, each with its own 3D medal emblem", () => {
    for (const id of [
      "personal-anecdote",
      "anecdote-callback",
      "rule-of-three",
      "pious-statement",
      "praise-jesus",
      "t-shirt-cannon",
    ]) {
      expect(items.has(id)).toBe(true);
    }
    expect(items.get("personal-anecdote").name).toBe("Personal anecdote");
    // Every gambit carries a readable line for the strip under the medals.
    for (const id of items.names()) {
      const summary = items.get(id).summary;
      expect(summary.length).toBeGreaterThan(20);
      expect(summary.length).toBeLessThan(160);
    }
    expect(items.get("anecdote-callback").name).toBe("Callback to anecdote");
    const emblems = items.names().map((id) => items.get(id).medal.emblem);
    expect(new Set(emblems).size).toBe(items.names().length);
    expect(items.get("personal-anecdote").medal.shape).toBe("round");
    expect(items.get("anecdote-callback").medal.shape).toBe("square");
    expect(items.get("personal-anecdote").visual.traits).toHaveLength(3);
    for (const id of items.names()) {
      expect(items.get(id).visual.traits?.length).toBeGreaterThan(0);
      expect(items.get(id).simulation.outcomes[0]!.effects.length).toBeGreaterThan(0);
    }
  });

  it("spawns the composed visual model", () => {
    const world = new World();
    const room = world.createRoot("room");
    const visual = spawnSpec(room, personalAnecdote.visual);
    expect(visual.kind).toBe("anecdote-visual");
    expect(visual.has(Sign)).toBe(true);
    world.update(0);
    world.clear();
  });

  it("picks outcomes by weight", () => {
    const item: ItemDef = {
      id: "test",
      name: "Test",
      summary: "Does a test thing.",
      medal: { shape: "round", emblem: "story", metal: 0xffffff },
      gambitTraits: [],
      visual: { kind: "test-visual" },
      simulation: {
        outcomes: [
          { weight: 1, target: { kind: "audience" }, effects: [] },
          { weight: 3, target: { kind: "audience" }, effects: [] },
        ],
      },
    };
    expect(chooseOutcome(item, 0)).toBe(item.simulation.outcomes[0]);
    expect(chooseOutcome(item, 0.2)).toBe(item.simulation.outcomes[0]);
    expect(chooseOutcome(item, 0.3)).toBe(item.simulation.outcomes[1]);
    expect(chooseOutcome(item, 0.99)).toBe(item.simulation.outcomes[1]);
    expect(() => chooseOutcome({ ...item, simulation: { outcomes: [] } }, 0.5)).toThrow(
      "no outcomes",
    );
  });
});

describe("gambit effects", () => {
  it("rewards engaged listeners but can injure a disengaged listener", () => {
    const [boost, injury] = tShirtCannon.simulation.outcomes[0]!.effects;
    const engaged = member({ state: { approval: 0, engagement: 0.8 } });
    expect(applyEffect(engaged, boost!, tShirtCannon.id, 2, 0.1)).not.toBeNull();
    expect(engaged.state.approval).toBeGreaterThan(0);
    expect(engaged.state.engagement).toBeGreaterThan(0.8);
    expect(applyEffect(engaged, injury!, tShirtCannon.id, 2, 0.1)).toBeNull();

    const injured = member({ state: { approval: 0.5, engagement: 0.2 } });
    expect(applyEffect(injured, injury!, tShirtCannon.id, 2, 0.1)).not.toBeNull();
    expect(injured.state).toEqual({ approval: -1, engagement: 1 });
    const safe = member({ state: { approval: 0, engagement: 0.2 } });
    expect(applyEffect(safe, injury!, tShirtCannon.id, 2, 0.9)).toBeNull();
    expect(safe.state).toEqual({ approval: 0, engagement: 0.2 });
  });

  it("makes a rule of three engage attentive listeners, shaped by intelligence", () => {
    const effect = ruleOfThree.simulation.outcomes[0]!.effects[0]!;
    const lessReceptive = member({ personality: { ...personality, intelligence: 0 } });
    const moreReceptive = member({ personality: { ...personality, intelligence: 1 } });
    applyEffect(lessReceptive, effect, ruleOfThree.id, 3);
    applyEffect(moreReceptive, effect, ruleOfThree.id, 3);
    expect(moreReceptive.state.engagement).toBeGreaterThan(lessReceptive.state.engagement);
    const asleep = member({ state: { approval: 0, engagement: 0.05 } });
    expect(applyEffect(asleep, effect, ruleOfThree.id, 3)).toBeNull();
  });

  it("uses faith affinity, independently of superstition, for religious gambits", () => {
    for (const gambit of [piousStatement, praiseJesus]) {
      const effect = gambit.simulation.outcomes[0]!.effects[0]!;
      const faithful = member({
        personality: { ...personality, faithAffinity: 1, superstition: 0 },
      });
      const irreligious = member({
        personality: { ...personality, faithAffinity: 0, superstition: 1 },
      });
      applyEffect(faithful, effect, gambit.id, 3);
      applyEffect(irreligious, effect, gambit.id, 3);
      expect(faithful.state.approval).toBeGreaterThan(0);
      expect(irreligious.state.approval).toBeLessThan(0);
      expect(faithful.state.approval).toBeCloseTo(-irreligious.state.approval);
    }
    expect(praiseJesus.simulation.outcomes[0]!.effects[0]!.amount.approval).toBeGreaterThan(
      piousStatement.simulation.outcomes[0]!.effects[0]!.amount.approval!,
    );
  });

  it("lifts someone who is paying attention and remembers it", () => {
    const person = member();
    const effect = personalAnecdote.simulation.outcomes[0]!.effects[0]!;
    const result = applyEffect(person, effect, personalAnecdote.id, 4);
    expect(result).not.toBeNull();
    expect(person.state.engagement).toBeCloseTo(0.9, 5);
    expect(person.memory).toEqual([{ id: "personal-anecdote", atSeconds: 4 }]);
  });

  it("is missed by someone too disengaged, who neither changes nor remembers", () => {
    const person = member({ state: { approval: 0, engagement: 0.1 } });
    const effect = personalAnecdote.simulation.outcomes[0]!.effects[0]!;
    expect(applyEffect(person, effect, personalAnecdote.id, 4)).toBeNull();
    expect(person.state).toEqual({ approval: 0, engagement: 0.1 });
    expect(person.memory).toEqual([]);
  });

  it("makes a callback land hardest about fifteen seconds after the anecdote", () => {
    const at = (heardAt: number, now: number) => {
      const person = member({ memory: [{ id: "personal-anecdote", atSeconds: heardAt }] });
      const effect = anecdoteCallback.simulation.outcomes[0]!.effects[0]!;
      applyEffect(person, effect, anecdoteCallback.id, now);
      return person.state.approval;
    };
    expect(at(0, 2)).toBeCloseTo(0.2 * 0.7, 5); // too soon: repetition
    expect(at(0, 15)).toBeCloseTo(0.2 * 2, 5); // the sweet spot: doubled
    expect(at(0, 40)).toBeCloseTo(0.2 * 1.2, 5); // long after: fading
    // Someone who never heard it gets the awkward version.
    const stranger = member();
    const effect = anecdoteCallback.simulation.outcomes[0]!.effects[0]!;
    applyEffect(stranger, effect, anecdoteCallback.id, 10);
    expect(stranger.state.approval).toBeCloseTo(0.2 * 0.4, 5);
  });
});

describe("judging a move", () => {
  it("calls a move that warmed the crowd a success, and one that did not a failure", () => {
    expect(
      judge([{ effects: [{ effect: { name: "x", amount: {} }, approval: 0.2, engagement: 0.1 }] }]),
    ).toBe("success");
    expect(
      judge([
        { effects: [{ effect: { name: "x", amount: {} }, approval: -0.2, engagement: 0.1 }] },
      ]),
    ).toBe("failure");
    // Nobody reached means nothing landed.
    expect(judge([null, { effects: [] }])).toBe("failure");
  });

  it("plays the effects listed for the verdict", () => {
    const item: ItemDef = {
      id: "cheer",
      name: "Cheer",
      summary: "Raises approval.",
      medal: { shape: "round", emblem: "story", metal: 0xffffff },
      gambitTraits: [],
      visual: { kind: "cheer" },
      simulation: {
        outcomes: [
          {
            weight: 1,
            target: { kind: "audience" },
            effects: [{ name: "cheer", amount: { approval: 0.4 } }],
          },
        ],
        onSuccess: [{ id: "house-lift" }],
        onFailure: [{ id: "house-dip" }],
      },
    };
    expect(effectsFor(item, "success")).toEqual([{ id: "house-lift" }]);
    expect(effectsFor(item, "failure")).toEqual([{ id: "house-dip" }]);

    const { world, room } = scene();
    const resolution = resolveItem(item, [member()], 2, { world, room }, 0);
    expect(resolution.verdict).toBe("success");
    expect(world.lightLevels.get("house")).toBe(1);
  });
});

describe("resolving an item on a crowd", () => {
  it("fires three shirts at the same distinct people selected by the simulation", () => {
    const { world, room } = scene();
    const crowd = Array.from({ length: 7 }, (_, index) =>
      member({ position: [index, 0.7, -2], state: { approval: 0, engagement: 0.8 } }),
    );
    const fired: unknown[] = [];
    room.on(T_SHIRT_FIRED, (event) => fired.push(event));
    const result = resolveItem(tShirtCannon, crowd, 3, { world, room }, 0.25);
    expect(result.targetIndices).toHaveLength(3);
    expect(new Set(result.targetIndices).size).toBe(3);
    expect(result.people.filter((person) => person !== null)).toHaveLength(3);
    const barrage = room.children.find((child) => child.has(TShirtBarrage))!;
    expect(barrage.settingsOf(TShirtBarrage)!.targets).toEqual(
      result.targetIndices.map((index) => crowd[index]!.position),
    );
    world.update(0);
    world.update(0.22);
    world.update(0.22);
    expect(fired).toHaveLength(3);
    world.update(1);
    expect(room.children.some((child) => child.has(TShirtBarrage))).toBe(false);
    const replay = resolveItem(tShirtCannon, crowd, 3, { world, room }, 0.25);
    expect(replay.targetIndices).toEqual(result.targetIndices);
  });

  it("reaches the whole audience and leaves a per-person record", () => {
    const crowd = [member(), member({ state: { approval: 0.5, engagement: 0.1 } })];
    const resolution = resolveItem(personalAnecdote, crowd, 3, scene(), 0.5);
    expect(resolution.item.id).toBe("personal-anecdote");
    expect(resolution.atSeconds).toBe(3);
    expect(resolution.people[0]!.effects).toHaveLength(1);
    // The disengaged person is still listed, but nothing landed.
    expect(resolution.people[1]!.effects).toHaveLength(0);
    expect(crowd[1]!.memory).toEqual([]);
  });

  it("limits a neighbourhood target to people near the aim point", () => {
    const item: ItemDef = {
      id: "nearby",
      name: "Nearby",
      summary: "Reaches only the nearest listeners.",
      medal: { shape: "round", emblem: "story", metal: 0xffffff },
      gambitTraits: [],
      visual: { kind: "nearby-visual" },
      simulation: {
        outcomes: [
          {
            weight: 1,
            target: { kind: "neighbourhood", radiusMetres: 1 },
            effects: [{ name: "nearby", amount: { approval: 0.5 } }],
          },
        ],
      },
    };
    const crowd = [
      member({ position: [0, 0, 0] }),
      member({ position: [0.5, 0, 0] }),
      member({ position: [5, 0, 0] }),
    ];
    const resolution = resolveItem(item, crowd, 1, scene(), 0);
    expect(resolution.people[0]).not.toBeNull();
    expect(resolution.people[1]).not.toBeNull();
    expect(resolution.people[2]).toBeNull();
    expect(crowd[2]!.state.approval).toBe(0);
  });
});
