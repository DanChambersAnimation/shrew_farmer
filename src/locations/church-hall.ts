import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Light } from "../traits/light.ts";
import { Shape } from "../traits/shape.ts";
import { Sign } from "../traits/sign.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

/** Interior size in metres. The back wall (with the sign) is at -z. */
export const HALL = { width: 12, depth: 16, height: 6 } as const;

const WALL = 0xe6dcc3;
const FLOOR = 0x9a6b3f;

function slab(kind: string, size: Vec3, position: Vec3, color: number): ObjectSpec {
  return {
    kind,
    traits: [trait(Transform, { position }), trait(Shape, { size, color })],
  };
}

/** The church hall: a plain box room with a sign on the back wall. */
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
      {
        kind: "sign",
        traits: [
          trait(Transform, { position: [0, h * 0.6, -d / 2 + 0.01] }),
          trait(Sign, { text: "Church Hall", width: 4, height: 1 }),
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
