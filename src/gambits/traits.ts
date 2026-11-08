import { Registry } from "../core/registry.ts";

/** The use history a gambit trait sees at a point in the round. */
export interface GambitUseContext {
  readonly atSeconds: number;
  readonly uses: number;
  readonly lastUsedAt?: number;
}

export interface GambitCooldown {
  readonly durationSeconds: number;
  readonly remainingSeconds: number;
}

/** A named trait with plain settings, attached to one gambit definition. */
export interface GambitTraitEntry {
  readonly id: string;
  readonly settings: object;
}

export interface GambitTraitDef<S extends object> {
  readonly id: string;
  readonly canUse?: (context: GambitUseContext, settings: Readonly<S>) => boolean;
  readonly exhausted?: (context: GambitUseContext, settings: Readonly<S>) => boolean;
  readonly effectReady?: (context: GambitUseContext, settings: Readonly<S>) => boolean;
  readonly cooldown?: (context: GambitUseContext, settings: Readonly<S>) => GambitCooldown | null;
}

interface RegisteredGambitTrait {
  readonly canUse: (context: GambitUseContext, settings: object) => boolean;
  readonly exhausted: (context: GambitUseContext, settings: object) => boolean;
  readonly effectReady: (context: GambitUseContext, settings: object) => boolean;
  readonly cooldown: (context: GambitUseContext, settings: object) => GambitCooldown | null;
}

/** Registry of behavior that gates use or changes when a gambit fires. */
export const gambitTraits = new Registry<RegisteredGambitTrait>("gambit trait");

export function defineGambitTrait<S extends object>(def: GambitTraitDef<S>): GambitTraitDef<S> {
  gambitTraits.register(def.id, {
    canUse: (context, settings) => def.canUse?.(context, settings as S) ?? true,
    exhausted: (context, settings) => def.exhausted?.(context, settings as S) ?? false,
    effectReady: (context, settings) => def.effectReady?.(context, settings as S) ?? true,
    cooldown: (context, settings) => def.cooldown?.(context, settings as S) ?? null,
  });
  return def;
}

/** Type-check an item's settings while retaining a plain registry reference. */
export function gambitTrait<S extends object>(
  def: GambitTraitDef<S>,
  settings: S,
): GambitTraitEntry {
  return { id: def.id, settings };
}

function remaining(context: GambitUseContext, seconds: number): number {
  return context.lastUsedAt === undefined
    ? 0
    : Math.max(0, context.lastUsedAt + seconds - context.atSeconds);
}

/** Prevents repeat use for a fixed span after each accepted use. */
export const Cooldown = defineGambitTrait({
  id: "cooldown",
  canUse: (context, { seconds }: { seconds: number }) => remaining(context, seconds) === 0,
  cooldown: (context, { seconds }: { seconds: number }) => {
    const remainingSeconds = remaining(context, seconds);
    return remainingSeconds > 0 ? { durationSeconds: seconds, remainingSeconds } : null;
  },
});

/** Permanently exhausts and burns away an item after its final use. */
export const LimitedUse = defineGambitTrait({
  id: "limited-use",
  canUse: (context, { count }: { count: number }) => context.uses < count,
  exhausted: (context, { count }: { count: number }) => context.uses >= count,
});

/** Fires the simulation effect on every Nth accepted use. */
export const BuildUp = defineGambitTrait({
  id: "build-up",
  effectReady: (context, { count }: { count: number }) =>
    context.uses > 0 && context.uses % count === 0,
});

export interface GambitTraitStatus {
  readonly canUse: boolean;
  readonly exhausted: boolean;
  readonly effectReady: boolean;
  readonly cooldown: GambitCooldown | null;
}

/** Combine every attached trait's rules at the current round time. */
export function evaluateGambitTraits(
  entries: readonly GambitTraitEntry[],
  context: GambitUseContext,
): GambitTraitStatus {
  let canUse = true;
  let exhausted = false;
  let effectReady = true;
  let cooldown: GambitCooldown | null = null;
  for (const { id, settings } of entries) {
    const def = gambitTraits.get(id);
    if (!def.canUse(context, settings)) canUse = false;
    if (def.exhausted(context, settings)) exhausted = true;
    if (!def.effectReady(context, settings)) effectReady = false;
    cooldown = def.cooldown(context, settings) ?? cooldown;
  }
  return { canUse: canUse && !exhausted, exhausted, effectReady, cooldown };
}
