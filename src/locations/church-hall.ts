import type { ObjectSpec } from "../core/spec.ts";
import { slab } from "../prefabs/blocks.ts";
import { CHAIR_HEIGHT, chair } from "../prefabs/chair.ts";
import { trait } from "../core/trait.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { Light } from "../traits/light.ts";
import { Sign } from "../traits/sign.ts";
import { Transform } from "../traits/transform.ts";

/** Interior size in metres. The back wall (with the sign) is at -z. */
export const HALL = { width: 12, depth: 16, height: 6 } as const;

/** The stage: a chair-high platform across the near (+z) end, from `front` to the wall. */
export const STAGE = { height: CHAIR_HEIGHT, front: 0.5 } as const;

/** Distance from the stage front to the front row of chairs, in metres. */
const FRONT_ROW_GAP = 0.8;

const WALL = 0xe6dcc3;
const FLOOR = 0x9a6b3f;

/** Rows of chairs at the far (-z) end, facing the stage end, with a centre aisle. */
function seating(rows = 4, perSide = 5): ObjectSpec {
  const spacing = 0.78;
  const chairs: ObjectSpec[] = [];
  for (let r = 0; r < rows; r++) {
    const z = STAGE.front - FRONT_ROW_GAP - r * 1.2;
    const stagger = (r % 2) * (spacing / 2); // so rows behind see between heads
    for (let c = 0; c < perSide; c++) {
      const x = 0.7 + c * spacing + stagger;
      chairs.push(chair([-x, 0, z]), chair([x, 0, z]));
    }
  }
  return { kind: "seating", children: chairs };
}

function stage(): ObjectSpec {
  const { width: w, depth: d } = HALL;
  const { height: sh, front } = STAGE;
  const depth = d / 2 - front;
  return {
    kind: "stage",
    children: [
      slab("stage-deck", [w, sh, depth], [0, sh / 2, front + depth / 2], 0xb07a45),
      slab("stage-front", [w, sh, 0.04], [0, sh / 2, front - 0.02], 0x5e3b22),
    ],
  };
}

/** The church hall: a box room with a stage at one end, seats at the other, and a sign. */
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
      stage(),
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
        traits: [
          trait(Light, {
            kind: "hemisphere",
            color: 0xfff4e0,
            groundColor: 0x6b4a2b,
            group: "house",
          }),
        ],
      },
      {
        kind: "light",
        traits: [
          trait(Transform, { position: [0, h - 0.5, 0] }),
          trait(Light, { kind: "point", color: 0xfff1cc, intensity: 40, group: "house" }),
        ],
      },
    ],
  };
}
