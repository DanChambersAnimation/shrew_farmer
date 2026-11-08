import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { ClockHands } from "../traits/clock-hands.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

/** A hand from the clock's centre, pointing up (+y) at rest. */
function hand(kind: string, length: number, width: number, color: number, z: number): ObjectSpec {
  return {
    kind,
    traits: [trait(Transform, { position: [0, 0, z] })],
    children: [slab(`${kind}-blade`, [width, length, 0.006], [0, length / 2 - 0.02, 0], color)],
  };
}

/** A round wall clock of `diameter` metres showing the real time, facing +z, centred on `position`. */
export function wallClock(position: Vec3, diameter = 0.45): ObjectSpec {
  const r = diameter / 2;
  return {
    kind: "wall-clock",
    traits: [
      trait(Transform, { position }),
      trait(ClockHands),
      trait(Inspectable, {
        title: "Clock",
        description: "Running about five minutes slow. As always.",
      }),
    ],
    children: [
      // The rim: a short black cylinder turned to face forward.
      {
        kind: "rim",
        traits: [trait(Transform, { position: [0, 0, 0.025], rotation: [90, 0, 0] })],
        children: [
          slab("rim-body", [diameter + 0.05, 0.05, diameter + 0.05], [0, 0, 0], 0x1c1c1c, {
            shape: "cylinder",
          }),
        ],
      },
      slab("face", [diameter, diameter, 0.01], [0, 0, 0.052], 0xffffff, {
        shape: "disc",
        texture: "clock-face",
        textureSize: diameter,
      }),
      hand("hour-hand", r * 0.55, 0.022, 0x111111, 0.058),
      hand("minute-hand", r * 0.82, 0.014, 0x111111, 0.062),
      hand("second-hand", r * 0.88, 0.006, 0xc81e1e, 0.066),
      slab("pin", [0.025, 0.012, 0.025], [0, 0, 0.07], 0x111111, { shape: "sphere" }),
    ],
  };
}
