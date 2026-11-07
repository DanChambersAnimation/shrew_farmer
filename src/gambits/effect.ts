import type { AudiencePersonality, AudienceState } from "../characters/audience-model.ts";
import type { MemoryEntry } from "../characters/crowd.ts";
import type { ObjectSpec } from "../core/spec.ts";
import type { EffectRef, Verdict } from "../effects/registry.ts";

/**
 * One possible thing an item does when used: a weighted outcome, aimed at part
 * of the room, applying effects to whoever it reaches. Gambits, power-ups and
 * equipment are all lists of these, so none of them gets special-case code.
 */
export interface Outcome {
  /** Relative likelihood among the item's outcomes; they are normalised. */
  readonly weight: number;
  /** What this outcome reaches. */
  readonly target: Target;
  /** What it does to each person it reaches. */
  readonly effects: readonly Effect[];
  /** Shown to the player once this outcome has been seen. */
  readonly description?: string;
}

/** Who an outcome reaches. */
export type Target =
  | { readonly kind: "audience" }
  | { readonly kind: "room" }
  | { readonly kind: "random"; readonly count: number }
  | { readonly kind: "neighbourhood"; readonly radiusMetres: number };

/** What one person knows about the world when an effect is evaluated. */
export interface EffectContext {
  readonly state: Readonly<AudienceState>;
  readonly personality: Readonly<AudiencePersonality>;
  /** Moves that already reached this person this round. */
  readonly memory: readonly MemoryEntry[];
  /** Round time in seconds. */
  readonly atSeconds: number;
  /** One deterministic draw for this person and this use. */
  readonly roll: number;
}

/** Changes one person's state in response to a move. */
export interface Effect {
  readonly name: string;
  /** The base change for one person, before any rule scales it. */
  readonly amount: Readonly<{ approval?: number; engagement?: number }>;
  /**
   * Whether this person registers the move at all. Someone too disengaged
   * misses it, so it neither changes them nor enters their memory.
   */
  readonly reaches?: (ctx: EffectContext) => boolean;
  /** Scales `amount` for this person, e.g. a follow-up that lands better later. */
  readonly scale?: (ctx: EffectContext) => number;
}

export interface ItemDef {
  readonly id: string;
  readonly name: string;
  /**
   * URL of the icon used in the gambit row. The row supplies the accessible
   * label from `name`; the artwork stays independent of the simulation.
   */
  readonly icon: string;
  /** How often this gambit can be invoked during a round. */
  readonly usage: Readonly<{
    /** Null means unlimited uses; a number is the round's total allowance. */
    maxUses: number | null;
    /** Only every Nth accepted use releases the simulation effect. */
    usesPerEffect: number;
    /** Minimum seconds between accepted uses, even when an effect has not fired yet. */
    cooldownSeconds: number;
  }>;
  /** A spawnable scene object assembled from visual traits. */
  readonly visual: ObjectSpec;
  /** Weighted outcomes composed from effects on audience members. */
  readonly simulation: Readonly<{
    outcomes: readonly Outcome[];
    /** Scene, lighting, animation and audio effects to play, by verdict. */
    onSuccess?: readonly EffectRef[];
    onFailure?: readonly EffectRef[];
  }>;
}

/** A person the resolver can change, as the crowd simulation stores them. */
export interface ResolvedPerson {
  readonly state: AudienceState;
  readonly personality: AudiencePersonality;
  readonly memory: MemoryEntry[];
}

/** What one effect did to one person. */
export interface EffectResult {
  readonly effect: Effect;
  /** The change applied after scaling and clamping, which may be zero. */
  readonly approval: number;
  readonly engagement: number;
}

/** What happened to one person when an item was used. */
export interface PersonResult {
  readonly effects: readonly EffectResult[];
}

/** What happened to the room when an item was used. */
export interface Resolution {
  readonly item: ItemDef;
  readonly outcome: Outcome;
  /** How the move went, which decided which effects played. */
  readonly verdict: Verdict;
  /** One entry per person passed in, or null when the outcome never reached them. */
  readonly people: readonly (PersonResult | null)[];
  /** Indices of the people selected by the outcome's target. */
  readonly targetIndices: readonly number[];
  readonly atSeconds: number;
}

/** Pick an outcome by weight from `roll`, a number in [0, 1). */
export function chooseOutcome(item: ItemDef, roll: number): Outcome {
  const { outcomes } = item.simulation;
  if (outcomes.length === 0) throw new Error(`Item "${item.id}" has no outcomes`);
  const total = outcomes.reduce((sum, outcome) => sum + Math.max(0, outcome.weight), 0);
  if (!(total > 0)) throw new Error(`Item "${item.id}" has no outcome with a positive weight`);
  let threshold = roll * total;
  for (const outcome of outcomes) {
    threshold -= Math.max(0, outcome.weight);
    if (threshold < 0) return outcome;
  }
  return outcomes[outcomes.length - 1]!;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/**
 * Apply one effect to one person as part of `moveId`. Returns null when the
 * effect never reached them, which also keeps it out of their memory.
 */
export function applyEffect(
  person: ResolvedPerson,
  effect: Effect,
  moveId: string,
  atSeconds: number,
  roll = 0.5,
): EffectResult | null {
  const ctx: EffectContext = {
    state: person.state,
    personality: person.personality,
    memory: person.memory,
    atSeconds,
    roll,
  };
  if (effect.reaches && !effect.reaches(ctx)) return null;

  const scale = effect.scale?.(ctx) ?? 1;
  const before = { ...person.state };
  person.state.approval = clamp(before.approval + (effect.amount.approval ?? 0) * scale, -1, 1);
  person.state.engagement = clamp(
    before.engagement + (effect.amount.engagement ?? 0) * scale,
    0,
    1,
  );
  person.memory.push({ id: moveId, atSeconds });
  return {
    effect,
    approval: person.state.approval - before.approval,
    engagement: person.state.engagement - before.engagement,
  };
}
