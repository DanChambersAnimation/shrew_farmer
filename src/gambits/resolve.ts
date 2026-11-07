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

/** One person in the room as the resolver sees them, with where they sit. */
export interface CrowdMember extends ResolvedPerson {
  /** Seat position, used by neighbourhood targets. */
  readonly position: Vec3;
}

/**
 * Use `item` on the room. Everybody is evaluated from the same starting state,
 * so no one's response depends on the order they are resolved in.
 */
export function resolveItem(
  item: ItemDef,
  crowd: readonly CrowdMember[],
  atSeconds: number,
  roll = Math.random(),
): Resolution {
  const outcome = chooseOutcome(item, roll);
  const reached = new Set(reachedBy(outcome.target, crowd));
  const people: (PersonResult | null)[] = crowd.map((member, index) =>
    reached.has(index) ? resolvePerson(item, member, outcome, atSeconds) : null,
  );
  return { item, outcome, people, atSeconds };
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
