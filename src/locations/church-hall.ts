import type { ObjectSpec } from "../core/spec.ts";
import { slab } from "../prefabs/blocks.ts";
import { CHAIR_HEIGHT, chair } from "../prefabs/chair.ts";
import { fireDoors, fireExtinguisher } from "../prefabs/fire-exit.ts";
import { noticeboard } from "../prefabs/noticeboard.ts";
import { mopAndBucket, smilingVacuum } from "../prefabs/cleaning.ts";
import { radiator } from "../prefabs/radiator.ts";
import { streetlight } from "../prefabs/streetlight.ts";
import { windowFrame } from "../prefabs/window.ts";
import { trait } from "../core/trait.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { DayNight, Sky } from "../traits/day-night.ts";
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
/** Neutral stone-coloured wall pillars. */
const PILLAR = 0xcfc6b6;
/** Pillars along the side walls, roughly 5 m apart; windows sit between them. */
const PILLAR_SPACING = 5;
/** Side windows: real openings in the wall, centred in each bay between pillars. */
const WINDOW = { width: 2.6, height: 3, centre: 3.2 } as const;
/** Wall thickness. */
const WALL_T = 0.2;
/** Tint over the parquet texture (white = the wood as drawn). */
const FLOOR = 0xffffff;

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
      // Floorboards running left to right across the stage.
      slab("stage-deck", [w, sh, depth], [0, sh / 2, front + depth / 2], 0xffffff, {
        texture: "floorboards",
        textureSize: 2.4,
        roughness: 0.55,
      }),
      slab("stage-front", [w, sh, 0.04], [0, sh / 2, front - 0.02], 0x5e3b22),
    ],
  };
}

/** Centres (z) of the side-wall bays, one window each. */
function bays(): number[] {
  const d = HALL.depth;
  const count = Math.round(d / PILLAR_SPACING);
  return Array.from({ length: count }, (_, i) => -d / 2 + (i + 0.5) * (d / count));
}

/**
 * Both side walls, built around real window openings: a strip below the
 * windows, a strip above, and the piers between. Pillars stand on the inside
 * at the bay edges, with a window and a radiator in each bay.
 */
function sideWalls(): ObjectSpec {
  const { width: w, depth: d, height: h } = HALL;
  const children: ObjectSpec[] = [];
  const centres = bays();
  const spacing = d / centres.length;
  const [sill, head] = [WINDOW.centre - WINDOW.height / 2, WINDOW.centre + WINDOW.height / 2];
  for (const side of [-1, 1] as const) {
    const wallX = side * (w / 2);
    const x = wallX + side * (WALL_T / 2);
    children.push(
      slab("wall", [WALL_T, sill, d], [x, sill / 2, 0], WALL),
      slab("wall", [WALL_T, h - head, d], [x, (h + head) / 2, 0], WALL),
    );
    // Piers between the openings (and at each end).
    const edges = [
      -d / 2,
      ...centres.flatMap((c) => [c - WINDOW.width / 2, c + WINDOW.width / 2]),
      d / 2,
    ];
    for (let i = 0; i + 1 < edges.length; i += 2) {
      const [z0, z1] = [edges[i]!, edges[i + 1]!];
      children.push(
        slab("wall", [WALL_T, head - sill, z1 - z0], [x, WINDOW.centre, (z0 + z1) / 2], WALL),
      );
    }
    for (let i = 0; i <= centres.length; i++) {
      const z = -d / 2 + i * spacing;
      children.push(slab("pillar", [0.3, h, 0.45], [wallX - side * 0.15, h / 2, z], PILLAR));
    }
    for (const c of centres) {
      // Windows face into the room: +x on the left wall, -x on the right.
      const facing: [number, number, number] = [0, side * -90, 0];
      children.push(
        windowFrame([wallX + side * 0.02, WINDOW.centre, c], facing, {
          width: WINDOW.width,
          height: WINDOW.height,
        }),
        // A radiator under each window.
        radiator([wallX, 0.15, c], facing),
      );
    }
  }
  return { kind: "side-walls", children };
}

/**
 * Outside both side walls: a paved path along the hall, a lawn with
 * streetlights at its edge, a red-brick boundary wall, and the sky. Day or
 * night follows world.outside (see DayNight).
 */
function grounds(): ObjectSpec {
  const { width: w } = HALL;
  const length = 40;
  const children: ObjectSpec[] = [];
  const outer = w / 2 + WALL_T;
  for (const side of [-1, 1] as const) {
    const band = (kind: string, from: number, to: number, texture: string, size: number) =>
      slab(kind, [to - from, 0.1, length], [side * ((from + to) / 2), -0.05, 0], 0xffffff, {
        texture,
        textureSize: size,
        roughness: 0.9,
      });
    children.push(
      band("path", outer, outer + 1.8, "paving", 1.8),
      band("lawn", outer + 1.8, outer + 9, "grass", 3),
      band("verge", outer + 9.5, outer + 30, "grass", 3),
      // Brick boundary wall with a stone coping.
      slab("boundary-wall", [0.3, 1.4, length], [side * (outer + 9.25), 0.7, 0], 0xffffff, {
        texture: "brick",
        textureSize: 1.6,
      }),
      slab("coping", [0.38, 0.08, length], [side * (outer + 9.25), 1.44, 0], 0xb8b1a4),
    );
    for (const z of [-10, -2, 6]) {
      // Lamps stand at the lawn's edge, arms reaching toward the hall.
      children.push(streetlight([side * (outer + 2.2), 0, z], [0, side === 1 ? 180 : 0, 0]));
    }
  }
  return {
    kind: "grounds",
    traits: [trait(DayNight), trait(Sky)],
    children: [
      ...children,
      // Light from the whole sky by day; fades out at night.
      {
        kind: "skylight",
        traits: [
          trait(Light, {
            kind: "hemisphere",
            color: 0xcfe2ff,
            groundColor: 0x5d7a3a,
            intensity: 1.1,
            group: "daylight",
          }),
        ],
      },
      // Daylight from high outside; fades out at night.
      {
        kind: "sun",
        traits: [
          // High overhead, so walls on both sides of the hall catch it.
          trait(Transform, { position: [3, 40, 12] }),
          trait(Light, {
            kind: "directional",
            color: 0xfff6e8,
            intensity: 1.2,
            target: [-3, -40, -12],
            group: "daylight",
          }),
        ],
      },
    ],
  };
}

/** The back wall's fittings: fire doors at the end of the aisle, extinguisher, noticeboard. */
function backWall(): ObjectSpec {
  const z = -HALL.depth / 2;
  return {
    kind: "back-wall",
    children: [
      fireDoors([0, 0, z]),
      fireExtinguisher([1.45, 0.3, z]),
      noticeboard([-3, 1.55, z]),
      // Cleaning things tucked into the back right corner.
      smilingVacuum([4.75, 0, z + 0.45], [0, -20, 0]),
      mopAndBucket([5.3, 0, z + 0.45], [0, -35, 0]),
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
      // Parquet laid on the diagonal.
      slab("floor", [w, t, d], [0, -t / 2, 0], FLOOR, {
        texture: "parquet",
        textureRotation: 45,
        roughness: 0.6,
      }),
      slab("ceiling", [w, t, d], [0, h + t / 2, 0], WALL),
      slab("wall", [w, h, t], [0, h / 2, -d / 2 - t / 2], WALL),
      slab("wall", [w, h, t], [0, h / 2, d / 2 + t / 2], WALL),
      sideWalls(),
      grounds(),
      backWall(),
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
