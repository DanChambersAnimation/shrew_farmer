import { describe, expect, it } from "vite-plus/test";
import { items } from "../gambits/library.ts";
import { anecdoteCallback, personalAnecdote } from "../gambits/items/anecdote.ts";
import { applyEffect, chooseOutcome, type ItemDef } from "../gambits/effect.ts";
import { resolveItem, type CrowdMember } from "../gambits/resolve.ts";

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
  });

  it("picks outcomes by weight", () => {
    const item: ItemDef = {
      id: "test",
      name: "Test",
      icon: "test",
      outcomes: [
        { weight: 1, target: { kind: "audience" }, effects: [] },
        { weight: 3, target: { kind: "audience" }, effects: [] },
      ],
    };
    expect(chooseOutcome(item, 0)).toBe(item.outcomes[0]);
    expect(chooseOutcome(item, 0.2)).toBe(item.outcomes[0]);
    expect(chooseOutcome(item, 0.3)).toBe(item.outcomes[1]);
    expect(chooseOutcome(item, 0.99)).toBe(item.outcomes[1]);
    expect(() => chooseOutcome({ ...item, outcomes: [] }, 0.5)).toThrow("no outcomes");
  });
});

describe("gambit effects", () => {
  it("lifts someone who is paying attention and remembers it", () => {
    const person = member();
    const effect = personalAnecdote.outcomes[0]!.effects[0]!;
    const result = applyEffect(person, effect, personalAnecdote.id, 4);
    expect(result).not.toBeNull();
    expect(person.state.engagement).toBeCloseTo(0.9, 5);
    expect(person.memory).toEqual([{ id: "personal-anecdote", atSeconds: 4 }]);
  });

  it("is missed by someone too disengaged, who neither changes nor remembers", () => {
    const person = member({ state: { approval: 0, engagement: 0.1 } });
    const effect = personalAnecdote.outcomes[0]!.effects[0]!;
    expect(applyEffect(person, effect, personalAnecdote.id, 4)).toBeNull();
    expect(person.state).toEqual({ approval: 0, engagement: 0.1 });
    expect(person.memory).toEqual([]);
  });

  it("makes a callback land hardest about fifteen seconds after the anecdote", () => {
    const at = (heardAt: number, now: number) => {
      const person = member({ memory: [{ id: "personal-anecdote", atSeconds: heardAt }] });
      const effect = anecdoteCallback.outcomes[0]!.effects[0]!;
      applyEffect(person, effect, anecdoteCallback.id, now);
      return person.state.approval;
    };
    expect(at(0, 2)).toBeCloseTo(0.2 * 0.7, 5); // too soon: repetition
    expect(at(0, 15)).toBeCloseTo(0.2 * 2, 5); // the sweet spot: doubled
    expect(at(0, 40)).toBeCloseTo(0.2 * 1.2, 5); // long after: fading
    // Someone who never heard it gets the awkward version.
    const stranger = member();
    const effect = anecdoteCallback.outcomes[0]!.effects[0]!;
    applyEffect(stranger, effect, anecdoteCallback.id, 10);
    expect(stranger.state.approval).toBeCloseTo(0.2 * 0.4, 5);
  });
});

describe("resolving an item on a crowd", () => {
  it("reaches the whole audience and leaves a per-person record", () => {
    const crowd = [member(), member({ state: { approval: 0.5, engagement: 0.1 } })];
    const resolution = resolveItem(personalAnecdote, crowd, 3, 0.5);
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
      outcomes: [
        {
          weight: 1,
          target: { kind: "neighbourhood", radiusMetres: 1 },
          effects: [{ name: "nearby", amount: { approval: 0.5 } }],
        },
      ],
    };
    const crowd = [
      member({ position: [0, 0, 0] }),
      member({ position: [0.5, 0, 0] }),
      member({ position: [5, 0, 0] }),
    ];
    const resolution = resolveItem(item, crowd, 1, 0);
    expect(resolution.people[0]).not.toBeNull();
    expect(resolution.people[1]).not.toBeNull();
    expect(resolution.people[2]).toBeNull();
    expect(crowd[2]!.state.approval).toBe(0);
  });
});
