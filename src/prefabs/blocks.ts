import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Shape } from "../traits/shape.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

/** A solid coloured cuboid of `size`, centred at `position`; `shape` overrides other Shape settings. */
export function slab(
  kind: string,
  size: Vec3,
  position: Vec3,
  color: number,
  shape: Partial<typeof Shape.defaults> = {},
): ObjectSpec {
  return {
    kind,
    traits: [trait(Transform, { position }), trait(Shape, { size, color, ...shape })],
  };
}
