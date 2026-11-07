import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Seat } from "../traits/seat.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const CHAIR = 0x6b4a32;
const SEAT_HEIGHT = 0.4;

/** A plain cuboid chair facing +z, with a seat point just in front of its seat. */
export function chair(position: Vec3 = [0, 0, 0]): ObjectSpec {
  const leg = (x: number, z: number) =>
    slab("chair-leg", [0.04, SEAT_HEIGHT - 0.05, 0.04], [x, (SEAT_HEIGHT - 0.05) / 2, z], CHAIR);
  return {
    kind: "chair",
    traits: [trait(Transform, { position }), trait(Seat, { sitPoint: [0, SEAT_HEIGHT, 0.24] })],
    children: [
      slab("chair-seat", [0.5, 0.05, 0.45], [0, SEAT_HEIGHT - 0.025, 0], CHAIR),
      slab("chair-back", [0.5, 0.5, 0.05], [0, SEAT_HEIGHT + 0.25, -0.2], CHAIR),
      leg(-0.22, -0.2),
      leg(0.22, -0.2),
      leg(-0.22, 0.2),
      leg(0.22, 0.2),
    ],
  };
}
