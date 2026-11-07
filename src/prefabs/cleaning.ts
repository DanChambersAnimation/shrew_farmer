import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const cylinder = { shape: "cylinder" as const };

/** A yellow mop bucket with a wringer, and a mop leaning against the wall behind it. */
export function mopAndBucket(position: Vec3, rotation: Vec3 = [0, 0, 0]): ObjectSpec {
  return {
    kind: "mop-and-bucket",
    traits: [
      trait(Transform, { position, rotation }),
      trait(Inspectable, {
        title: "Mop and bucket",
        description: "The water hasn't been changed since Easter.",
      }),
      trait(Highlight, { intensity: 0.12 }),
    ],
    children: [
      slab("bucket", [0.38, 0.3, 0.3], [0, 0.15, 0], 0xf2c21b, { ...cylinder, roughness: 0.5 }),
      slab("water", [0.34, 0.01, 0.26], [0, 0.27, 0], 0x7d7458, cylinder),
      slab("wringer", [0.2, 0.12, 0.16], [0.08, 0.36, 0], 0x8a8a8a, { metalness: 0.4 }),
      slab("wheel", [0.06, 0.06, 0.06], [-0.14, 0.03, 0.1], 0x222222, { shape: "sphere" }),
      slab("wheel", [0.06, 0.06, 0.06], [0.14, 0.03, 0.1], 0x222222, { shape: "sphere" }),
      {
        kind: "mop",
        traits: [trait(Transform, { position: [-0.05, 0, -0.18], rotation: [-14, 0, 6] })],
        children: [
          slab("handle", [0.03, 1.35, 0.03], [0, 0.8, 0], 0xb08a5a, cylinder),
          slab("mop-head", [0.2, 0.16, 0.2], [0, 0.08, 0], 0xd8d2c4, { ...cylinder, roughness: 1 }),
        ],
      },
    ],
  };
}

/**
 * A red canister vacuum with a cheerful face, a black lid, and its hose and
 * wand coiled beside it. Faces +z.
 */
export function smilingVacuum(position: Vec3, rotation: Vec3 = [0, 0, 0]): ObjectSpec {
  const r = 0.17;
  return {
    kind: "vacuum",
    traits: [
      trait(Transform, { position, rotation }),
      trait(Inspectable, {
        title: "Vacuum cleaner",
        description: "Smiling, as always. Nobody knows why.",
      }),
      trait(Highlight, { intensity: 0.12 }),
    ],
    children: [
      slab("body", [r * 2, 0.26, r * 2], [0, 0.17, 0], 0xd2232a, { ...cylinder, roughness: 0.35 }),
      slab("base", [r * 2.1, 0.05, r * 2.1], [0, 0.025, 0], 0x1a1a1a, cylinder),
      slab("lid", [r * 2, 0.08, r * 2], [0, 0.34, 0], 0x1a1a1a, { ...cylinder, roughness: 0.4 }),
      slab("handle", [0.16, 0.05, 0.04], [0, 0.4, 0], 0x1a1a1a),
      slab("face", [0.17, 0.17, 0.01], [0, 0.18, r + 0.002], 0xffffff, {
        shape: "plane",
        texture: "smiling-face",
        textureSize: 0.17,
      }),
      // Hose looping out of the side, and the wand propped against the wall.
      slab("hose", [0.05, 0.05, 0.4], [r + 0.02, 0.12, -0.05], 0x222222, {
        ...cylinder,
        castShadow: true,
      }),
      {
        kind: "wand",
        traits: [trait(Transform, { position: [r + 0.12, 0, -0.15], rotation: [-10, 0, -8] })],
        children: [
          slab("tube", [0.035, 0.9, 0.035], [0, 0.5, 0], 0xb8bcc2, {
            ...cylinder,
            metalness: 0.8,
            roughness: 0.3,
          }),
          slab("nozzle", [0.3, 0.05, 0.08], [0, 0.03, 0], 0x1a1a1a),
        ],
      },
    ],
  };
}
