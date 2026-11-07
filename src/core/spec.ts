import type { GameObject } from "./game-object.ts";
import type { TraitEntry } from "./trait.ts";

/** Data description of an object: its kind, traits (with settings) and children. */
export interface ObjectSpec {
  readonly kind: string;
  readonly traits?: readonly TraitEntry[];
  readonly children?: readonly ObjectSpec[];
}

/** Create the objects described by `spec` under `parent`. */
export function spawnSpec(parent: GameObject, spec: ObjectSpec): GameObject {
  const obj = parent.spawn(spec.kind, spec.traits);
  for (const child of spec.children ?? []) spawnSpec(obj, child);
  return obj;
}
