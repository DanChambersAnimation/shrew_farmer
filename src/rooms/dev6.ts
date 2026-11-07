import { rooms } from "../core/room-registry.ts";
import { type ObjectSpec, spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { HALL } from "../locations/church-hall.ts";
import { churchHallShow } from "../scenes/church-hall-show.ts";
import { ColorCycle, Pulse, Sweep } from "../traits/light-animation.ts";
import { Light } from "../traits/light.ts";
import { LightingCues } from "../traits/lighting-cues.ts";
import { Shape } from "../traits/shape.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

const CEILING = HALL.height - 0.1;
/** Roughly the middle of the audience, at head height. */
const AUDIENCE: Vec3 = [0, 0.9, -2.1];

const aim = (from: Vec3, to: Vec3): Vec3 => [to[0] - from[0], to[1] - from[1], to[2] - from[2]];

/** A spot light at `from` aimed at `to`, in a light group, plus any animation traits. */
function spot(
  group: string,
  from: Vec3,
  to: Vec3,
  light: Partial<typeof Light.defaults>,
  animations: ObjectSpec["traits"] = [],
): ObjectSpec {
  return {
    kind: `${group}-light`,
    traits: [
      trait(Transform, { position: from }),
      trait(Light, { kind: "spot", group, target: aim(from, to), penumbra: 0.3, ...light }),
      ...(animations ?? []),
    ],
  };
}

/**
 * Concert-style lighting effects in the church hall, cycled with L: sweeping
 * spots, a colour chase, a mirror ball and a strobe. Every effect is ordinary
 * lights plus small animation traits (Pulse, Sweep, ColorCycle).
 */
rooms.register({
  name: "dev6",
  title: "Lighting effects",
  tags: ["dev"],
  build(room) {
    // Added first so lights start at the first cue's levels.
    const off = { sweep: 0, chase: 0, disco: 0, strobe: 0 };
    room.add(LightingCues, {
      cues: {
        "House lights": { house: 1, ...off },
        "Sweeping spots": { house: 0.25, ...off, sweep: 1 },
        "Colour chase": { house: 0.25, ...off, chase: 1 },
        "Mirror ball": { house: 0.15, ...off, disco: 1 },
        // 2 flashes a second: under the usual 3-per-second photosensitivity limit.
        Strobe: { house: 0.1, ...off, strobe: 1 },
      },
    });
    churchHallShow(room);

    // Sweeping spots: two coloured beams from the front corners, crossing the crowd.
    for (const [side, color, phase] of [
      [-1, 0xff3bd1, 0],
      [1, 0x3bd1ff, 0.5],
    ] as const) {
      spawnSpec(
        room,
        spot(
          "sweep",
          [side * 4.5, CEILING, 1.5],
          [side * 2, AUDIENCE[1], AUDIENCE[2]],
          { color, intensity: 260, angle: 12 },
          [trait(Sweep, { amplitude: [3.5, 0, 1.2], period: 5, phase })],
        ),
      );
    }

    // Colour chase: four spots over the stage front, colours stepping in sequence.
    const chase = [0xff3030, 0xffa020, 0x40ff60, 0x30d0ff, 0x4060ff, 0xff40d0];
    [-3, -1, 1, 3].forEach((x, i) => {
      spawnSpec(
        room,
        spot(
          "chase",
          [x, CEILING, 0.5],
          [x, AUDIENCE[1], AUDIENCE[2]],
          { intensity: 190, angle: 14 },
          [trait(ColorCycle, { colors: chase, period: 0.35, phase: i })],
        ),
      );
    });

    // Mirror ball: a shiny sphere above the audience, and a dotted spot circling below it.
    const ball: Vec3 = [AUDIENCE[0], CEILING - 0.7, AUDIENCE[2]];
    spawnSpec(room, {
      kind: "mirror-ball",
      traits: [
        trait(Transform, { position: ball }),
        trait(Shape, {
          shape: "sphere",
          size: [0.5, 0.5, 0.5],
          color: 0xdddddd,
          metalness: 1,
          roughness: 0.15,
        }),
      ],
    });
    spawnSpec(
      room,
      spot(
        "disco",
        [ball[0], CEILING, ball[2]],
        [AUDIENCE[0], 0, AUDIENCE[2]],
        { color: 0xfff3e0, intensity: 420, angle: 55, penumbra: 0.2, pattern: "dots" },
        [trait(Sweep, { amplitude: [1.2, 0, 1.2], period: 6, circle: true })],
      ),
    );

    // Strobe: a bright white light flashing over the whole room.
    spawnSpec(room, {
      kind: "strobe-light",
      traits: [
        trait(Transform, { position: [0, CEILING - 0.5, 0] }),
        trait(Light, { kind: "point", group: "strobe", intensity: 90, fade: 0.2 }),
        trait(Pulse, { wave: "square", rate: 2 }),
      ],
    });
  },
});
