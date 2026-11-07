import { describe, expect, it } from "vite-plus/test";
import { items } from "../gambits/library.ts";
import { anecdoteCallback, personalAnecdote } from "../gambits/items/anecdote.ts";
import { applyEffect, chooseOutcome, type ItemDef } from "../gambits/effect.ts";
import { effectsFor, judge, resolveItem, type CrowdMember } from "../gambits/resolve.ts";
import { World } from "../core/world.ts";
import { spawnSpec } from "../core/spec.ts";
import "../effects/builtin.ts";
import { Sign } from "../traits/sign.ts";

const scene = () => {
  const world = new World();
  return { world, room: world.createRoot("room") };
};

const personality = {
  gullibility: 0.5,
  intelligence: 0.5,
  superstition: 0.5,
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
  it("registers the starter gambits by id, with a name and an icon", () => {
    expect(items.names()).toEqual(["personal-anecdote", "anecdote-callback"]);
    expect(items.get("personal-anecdote").name).toBe("Personal anecdote");
    expect(items.get("anecdote-callback").icon).toBe("callback");
    expect(items.get("personal-anecdote").visual.traits).toHaveLength(3);
    expect(items.get("personal-anecdote").simulation.outcomes[0]!.effects).toHaveLength(1);
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
      icon: "test",
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
      icon: "cheer",
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
      icon: "nearby",
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
