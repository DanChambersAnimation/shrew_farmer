import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const WHITE = 0xf1eee6;

/**
 * A wall-mounted panel radiator, `width` x `height` m, with vertical fins, a
 * pipe to the floor and a valve. Facing +z, its base at `position`; `rotation`
 * (degrees) turns it onto a wall.
 */
export function radiator(
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
  width = 1.6,
  height = 0.6,
): ObjectSpec {
  const fins: ObjectSpec[] = [];
  const count = Math.round(width / 0.08);
  for (let i = 0; i < count; i++) {
    const x = -width / 2 + (i + 0.5) * (width / count);
    fins.push(
      slab("fin", [0.035, height - 0.08, 0.03], [x, height / 2, 0.095], WHITE, { roughness: 0.5 }),
    );
  }
  return {
    kind: "radiator",
    traits: [trait(Transform, { position, rotation })],
    children: [
      slab("panel", [width, height, 0.06], [0, height / 2, 0.06], WHITE, { roughness: 0.5 }),
      slab("top", [width, 0.03, 0.1], [0, height - 0.015, 0.07], WHITE, { roughness: 0.5 }),
      ...fins,
      slab(
        "pipe",
        [0.022, 0.12, 0.022],
        [width / 2 - 0.05, -0.06 + 0.12 / 2 - 0.06, 0.06],
        0xdcdcdc,
        {
          shape: "cylinder",
          metalness: 0.6,
        },
      ),
      slab("valve", [0.05, 0.06, 0.05], [width / 2 - 0.05, 0.02, 0.06], 0xffffff, {
        shape: "cylinder",
      }),
    ],
  };
}
