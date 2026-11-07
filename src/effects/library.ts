// Load every effect module so they register themselves.
import.meta.glob(["./builtin.ts", "!./builtin.test.ts"], { eager: true });

export { runEffect, runEffects, effects } from "./registry.ts";
export type { EffectContext, EffectDef, EffectKind, EffectRef, Verdict } from "./registry.ts";
