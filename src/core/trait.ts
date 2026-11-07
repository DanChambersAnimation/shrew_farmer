import type { GameObject } from "./game-object.ts";
import type { World } from "./world.ts";

/** What a trait hook sees: the object it is attached to, its settings, and the world. */
export interface TraitContext<S extends object> {
  readonly object: GameObject;
  /** This attachment's settings. Mutable so other systems can tune behavior at runtime. */
  readonly settings: S;
  readonly world: World;
}

/**
 * A trait is the only place behavior lives. Objects are containers; attaching a
 * trait (with settings) to an object gives it that behavior.
 */
export interface TraitDef<S extends object> {
  readonly name: string;
  /** Default settings. Settings must stay plain data (serializable). */
  readonly defaults: S;
  /** Called when attached. May return a cleanup function, called when detached. */
  setup?(ctx: TraitContext<S>): void | (() => void);
  /** Called every frame while attached. */
  update?(ctx: TraitContext<S>, dt: number): void;
}

export function defineTrait<S extends object>(def: TraitDef<S>): TraitDef<S> {
  return def;
}

// oxlint-disable-next-line typescript/no-explicit-any -- heterogeneous trait lists need an erased settings type
export type AnyTraitDef = TraitDef<any>;

/** A trait plus setting overrides, as used in object specs. */
export interface TraitEntry {
  readonly def: AnyTraitDef;
  readonly settings: object;
}

/** Type-checked helper for building a {@link TraitEntry}. */
export function trait<S extends object>(def: TraitDef<S>, settings: Partial<S> = {}): TraitEntry {
  return { def, settings };
}
