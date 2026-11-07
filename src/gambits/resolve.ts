import type { GameObject } from "../core/game-object.ts";
import type { World } from "../core/world.ts";
import { type Verdict, runEffects } from "../effects/registry.ts";
import type { Vec3 } from "../traits/types.ts";
import {
  applyEffect,
  chooseOutcome,
  type Effect,
  type ItemDef,
  type Outcome,
  type PersonResult,
  type ResolvedPerson,
  type Resolution,
  type Target,
} from "./effect.ts";

/** Where a resolved move happened, for its effects to act on. */
export interface MoveScene {
  readonly world: World;
  readonly room: GameObject;
}

/** One person in the room as the resolver sees them, with where they sit. */
export interface CrowdMember extends ResolvedPerson {
  /** Seat position, used by neighbourhood targets. */
  readonly position: Vec3;
}

/**
 * How a move went, judged by what it actually did: if the crowd warmed to it,
 * it landed. A move that reached nobody counts as a failure.
 */
export function judge(people: readonly (PersonResult | null)[]): Verdict {
  let approval = 0;
  let reached = 0;
  for (const person of people) {
    if (!person) continue;
    reached++;
    for (const result of person.effects) approval += result.approval;
  }
  return reached > 0 && approval > 0 ? "success" : "failure";
}

/** Effects a move plays for a verdict. */
export function effectsFor(item: ItemDef, verdict: Verdict) {
  const { onSuccess, onFailure } = item.simulation;
  return (verdict === "success" ? onSuccess : onFailure) ?? [];
}

/**
 * Use `item` on the room. Everybody is evaluated from the same starting state,
 * so no one's response depends on the order they are resolved in. The verdict
 * then picks which of the item's effects play.
 */
export function resolveItem(
  item: ItemDef,
  crowd: readonly CrowdMember[],
  atSeconds: number,
  scene: MoveScene,
  roll = Math.random(),
): Resolution {
  const outcome = chooseOutcome(item, roll);
  const reached = new Set(reachedBy(outcome.target, crowd));
  const people: (PersonResult | null)[] = crowd.map((member, index) =>
    reached.has(index) ? resolvePerson(item, member, outcome, atSeconds) : null,
  );
  const verdict = judge(people);
  runEffects(effectsFor(item, verdict), {
    world: scene.world,
    room: scene.room,
    moveId: item.id,
    verdict,
    atSeconds,
  });
  return { item, outcome, people, atSeconds, verdict };
}

function resolvePerson(
  item: ItemDef,
  member: CrowdMember,
  outcome: Outcome,
  atSeconds: number,
): PersonResult {
  const effects = outcome.effects
    .map((effect: Effect) => applyEffect(member, effect, item.id, atSeconds))
    .filter((result) => result !== null);
  return { effects };
}

/** Indices of the people a target selects. An empty crowd reaches nobody. */
function reachedBy(target: Target, crowd: readonly CrowdMember[]): number[] {
  if (target.kind !== "neighbourhood" || crowd.length === 0) {
    return crowd.map((_, index) => index);
  }
  // Treated as a radius around the first member: the caller puts the person the
  // venue is aimed at there.
  const origin = crowd[0]!.position;
  return crowd
    .map((member, index) => ({ index, member }))
    .filter(({ member }) => distance(origin, member.position) <= target.radiusMetres)
    .map(({ index }) => index);
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
