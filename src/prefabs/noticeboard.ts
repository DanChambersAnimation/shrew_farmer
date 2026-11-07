import { Random } from "../core/random.ts";
import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const PAPERS = [0xfffdf5, 0xfff3a8, 0xd9f0ff, 0xffd9e6, 0xe6ffd9, 0xf2f2f2];
const PINS = [0xd62828, 0x1d4ed8, 0xf2b632, 0x16a34a];

/**
 * A cork noticeboard (`width` x `height` m, wooden frame) with a sparse, random
 * scatter of `count` pieces of paper, each slightly askew and pinned. The same
 * `seed` always gives the same board. Facing +z, centred on `position`.
 */
export function noticeboard(
  position: Vec3,
  { width = 1.8, height = 1.1, count = 6, seed = 3 } = {},
): ObjectSpec {
  const rng = new Random(seed);
  const papers: ObjectSpec[] = [];
  for (let i = 0; i < count; i++) {
    const w = 0.2 + rng.next() * 0.16;
    const h = w * (1.1 + rng.next() * 0.35);
    // Spread across the board in columns so they don't pile up, with some jitter.
    const x = ((i + 0.5) / count - 0.5) * (width - w) + (rng.next() - 0.5) * 0.12;
    const y = (rng.next() - 0.5) * (height - h - 0.08);
    papers.push({
      kind: "flier",
      traits: [
        trait(Transform, {
          position: [x, y, 0.045 + i * 0.002],
          rotation: [0, 0, (rng.next() - 0.5) * 14],
        }),
      ],
      children: [
        slab("paper", [w, h, 0.004], [0, 0, 0], rng.pick(PAPERS), { castShadow: false }),
        slab("pin", [0.025, 0.025, 0.02], [0, h / 2 - 0.03, 0.01], rng.pick(PINS), {
          shape: "sphere",
        }),
      ],
    });
  }
  return {
    kind: "noticeboard",
    traits: [
      trait(Transform, { position }),
      trait(Inspectable, { title: "Noticeboard", description: "Jumble sales, lost cats, rotas." }),
    ],
    children: [
      slab("frame", [width + 0.08, height + 0.08, 0.03], [0, 0, 0.015], 0x7a5232),
      slab("cork", [width, height, 0.02], [0, 0, 0.03], 0xffffff, {
        texture: "cork",
        textureSize: 1,
      }),
      ...papers,
    ],
  };
}
