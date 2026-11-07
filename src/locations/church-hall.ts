import type { ObjectSpec } from "../core/spec.ts";
import { slab } from "../prefabs/blocks.ts";
import { chair } from "../prefabs/chair.ts";
import { trait } from "../core/trait.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { Light } from "../traits/light.ts";
import { Sign } from "../traits/sign.ts";
import { Transform } from "../traits/transform.ts";

/** Interior size in metres. The back wall (with the sign) is at -z. */
export const HALL = { width: 12, depth: 16, height: 6 } as const;

const WALL = 0xe6dcc3;
const FLOOR = 0x9a6b3f;

/** Rows of chairs at the far (-z) end, facing the stage end, with a centre aisle. */
function seating(rows = 4, perSide = 5): ObjectSpec {
  const spacing = 0.78;
  const chairs: ObjectSpec[] = [];
  for (let r = 0; r < rows; r++) {
    const z = -2.8 - r * 1.2;
    const stagger = (r % 2) * (spacing / 2); // so rows behind see between heads
    for (let c = 0; c < perSide; c++) {
      const x = 0.7 + c * spacing + stagger;
      chairs.push(chair([-x, 0, z]), chair([x, 0, z]));
    }
  }
  return { kind: "seating", children: chairs };
}

/** The church hall: a plain box room, a sign on the back wall, and rows of seats. */
export function churchHall(): ObjectSpec {
  const { width: w, depth: d, height: h } = HALL;
  const t = 0.2;
  return {
    kind: "church-hall",
    children: [
      slab("floor", [w, t, d], [0, -t / 2, 0], FLOOR),
      slab("ceiling", [w, t, d], [0, h + t / 2, 0], WALL),
      slab("wall", [w, h, t], [0, h / 2, -d / 2 - t / 2], WALL),
      slab("wall", [w, h, t], [0, h / 2, d / 2 + t / 2], WALL),
      slab("wall", [t, h, d], [-w / 2 - t / 2, h / 2, 0], WALL),
      slab("wall", [t, h, d], [w / 2 + t / 2, h / 2, 0], WALL),
      seating(),
      {
        kind: "sign",
        traits: [
          trait(Transform, { position: [0, h * 0.6, -d / 2 + 0.01] }),
          trait(Sign, { text: "Church Hall", width: 4, height: 1 }),
          trait(Inspectable, {
            title: "Church hall sign",
            description:
              "A hand-painted sign. Tonight's venue is humble, but everyone starts somewhere.",
          }),
          trait(Highlight),
        ],
      },
      {
        kind: "light",
        traits: [trait(Light, { kind: "hemisphere", color: 0xfff4e0, groundColor: 0x6b4a2b })],
      },
      {
        kind: "light",
        traits: [
          trait(Transform, { position: [0, h - 0.5, 0] }),
          trait(Light, { kind: "point", color: 0xfff1cc, intensity: 40 }),
        ],
      },
    ],
  };
}
