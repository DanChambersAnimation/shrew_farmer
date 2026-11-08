import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Seat } from "../traits/seat.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const CHAIR = 0x6b4a32;
const SEAT_HEIGHT = 0.4;
const BACK_HEIGHT = 0.5;

/** Overall chair height (floor to top of the back), in metres. */
export const CHAIR_HEIGHT = SEAT_HEIGHT + BACK_HEIGHT;

/**
 * A plain cuboid chair facing +z; its sit point is at the back of the seat,
 * just above it. With `seat: false` it's just furniture (e.g. stacked away),
 * so nobody gets seated on it.
 */
export function chair(position: Vec3 = [0, 0, 0], { seat = true } = {}): ObjectSpec {
  const leg = (x: number, z: number) =>
    slab("chair-leg", [0.04, SEAT_HEIGHT - 0.05, 0.04], [x, (SEAT_HEIGHT - 0.05) / 2, z], CHAIR);
  return {
    kind: "chair",
    traits: [
      trait(Transform, { position }),
      ...(seat ? [trait(Seat, { sitPoint: [0, SEAT_HEIGHT + 0.01, -0.07] })] : []),
    ],
    children: [
      slab("chair-seat", [0.5, 0.05, 0.45], [0, SEAT_HEIGHT - 0.025, 0], CHAIR),
      slab("chair-back", [0.5, BACK_HEIGHT, 0.05], [0, SEAT_HEIGHT + BACK_HEIGHT / 2, -0.2], CHAIR),
      leg(-0.22, -0.2),
      leg(0.22, -0.2),
      leg(-0.22, 0.2),
      leg(0.22, 0.2),
    ],
  };
}

/**
 * A stack of `count` chairs, as stacking chairs nest: each one a little higher
 * and slightly shifted. None are seats. Stands at `position`, facing +z.
 */
export function chairStack(position: Vec3, count = 6, rotation: Vec3 = [0, 0, 0]): ObjectSpec {
  return {
    kind: "chair-stack",
    traits: [trait(Transform, { position, rotation })],
    children: Array.from({ length: count }, (_, i) =>
      chair([0, i * 0.075, i * 0.012], { seat: false }),
    ),
  };
}
