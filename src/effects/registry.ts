import { Registry } from "../core/registry.ts";
import type { GameObject } from "../core/game-object.ts";
import type { World } from "../core/world.ts";
import type { Vec3 } from "../traits/types.ts";

/**
 * What an effect can act on. Effects are called after a move resolves, by
 * whatever trait owns the move, with the room it happened in.
 */
export interface EffectContext {
  readonly world: World;
  /** The room root the move was played in. */
  readonly room: GameObject;
  /** The move that triggered this effect. */
  readonly moveId: string;
  /** How the move went. Effects can behave differently for each. */
  readonly verdict: Verdict;
  /** Round time in seconds. */
  readonly atSeconds: number;
  /** World positions selected by the simulation, for matching visual effects. */
  readonly targets?: readonly Vec3[];
}

export type Verdict = "success" | "failure";

/** The four things an effect may change. */
export type EffectKind = "visual" | "lighting" | "animation" | "audio";

/**
 * One named thing a move can make happen. Effects are looked up by id so moves
 * stay plain data: a gambit lists effect ids, and the registry says what they do.
 */
export interface EffectDef {
  readonly id: string;
  readonly kind: EffectKind;
  /** Run it. Must not throw for a merely missing target; effects are decoration. */
  run(ctx: EffectContext): void;
}

/** One effect to run, with optional settings overrides. */
export interface EffectRef {
  readonly id: string;
  readonly settings?: Readonly<Record<string, number>>;
}

/** Every effect a move can play, by id. Effect modules register themselves here. */
export const effects = new Registry<EffectDef>("effect");

/** Run an effect by reference. Unknown ids are a programming error, so they throw. */
export function runEffect(ref: EffectRef, ctx: EffectContext): void {
  effects.get(ref.id).run(ctx);
}

/** Run a list of effects in order, stopping at the first unknown id. */
export function runEffects(refs: readonly EffectRef[], ctx: EffectContext): void {
  for (const ref of refs) runEffect(ref, ctx);
}
