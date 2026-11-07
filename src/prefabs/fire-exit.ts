import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { Sign } from "../traits/sign.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const DOOR = 0x6f8796;
const FRAME = 0xf2efe6;
const METAL = 0xb9bdc2;

/**
 * Double fire doors (each leaf `leaf` x `height` m) in a white frame, with
 * push bars, narrow vision panels and a green FIRE EXIT sign above. Facing +z,
 * standing on the floor at `position`.
 */
export function fireDoors(
  position: Vec3,
  rotation: Vec3 = [0, 0, 0],
  leaf = 0.9,
  height = 2.1,
): ObjectSpec {
  const doorLeaf = (side: -1 | 1): ObjectSpec => {
    const x = side * (leaf / 2 + 0.01);
    return {
      kind: "door-leaf",
      traits: [trait(Transform, { position: [x, 0, 0] })],
      children: [
        slab("door", [leaf, height, 0.05], [0, height / 2, 0.025], DOOR),
        slab("vision-panel", [0.14, 0.6, 0.01], [-side * 0.25, height * 0.68, 0.055], 0xbfd8e6, {
          emissive: 0xbfd8e6,
          emissiveIntensity: 0.2,
        }),
        slab("push-bar", [leaf * 0.75, 0.05, 0.06], [0, 1.0, 0.08], METAL, {
          metalness: 0.7,
          roughness: 0.35,
        }),
      ],
    };
  };
  return {
    kind: "fire-doors",
    traits: [
      trait(Transform, { position, rotation }),
      trait(Inspectable, { title: "Fire exit", description: "Keep clear. Alarm will sound." }),
      trait(Highlight, { intensity: 0.12 }),
    ],
    children: [
      slab("door-frame", [leaf * 2 + 0.24, 0.12, 0.08], [0, height + 0.06, 0.04], FRAME),
      slab("door-frame", [0.1, height, 0.08], [-(leaf + 0.07), height / 2, 0.04], FRAME),
      slab("door-frame", [0.1, height, 0.08], [leaf + 0.07, height / 2, 0.04], FRAME),
      doorLeaf(-1),
      doorLeaf(1),
      {
        kind: "exit-sign",
        traits: [
          trait(Transform, { position: [0, height + 0.38, 0.02] }),
          trait(Sign, {
            text: "FIRE EXIT",
            width: 0.9,
            height: 0.28,
            background: 0x1f8f4a,
            textColor: 0xffffff,
            font: "Arial, sans-serif",
          }),
        ],
      },
    ],
  };
}

/** A red fire extinguisher on a wall bracket, its base at `position`. Facing +z. */
export function fireExtinguisher(position: Vec3): ObjectSpec {
  const cylinder = { shape: "cylinder" as const };
  return {
    kind: "fire-extinguisher",
    traits: [
      trait(Transform, { position }),
      trait(Inspectable, {
        title: "Fire extinguisher",
        description: "Water. Last inspected 2019. Probably fine.",
      }),
      trait(Highlight, { intensity: 0.12 }),
    ],
    children: [
      slab("bracket", [0.1, 0.06, 0.05], [0, 0.5, 0.025], 0x333333),
      slab("body", [0.16, 0.55, 0.16], [0, 0.275, 0.12], 0xc8102e, { ...cylinder, roughness: 0.4 }),
      slab("neck", [0.05, 0.06, 0.05], [0, 0.58, 0.12], 0x222222, cylinder),
      slab("handle", [0.12, 0.025, 0.03], [0, 0.62, 0.12], 0x222222),
      slab("hose", [0.025, 0.4, 0.025], [0.1, 0.32, 0.14], 0x111111, cylinder),
      {
        kind: "label",
        traits: [
          trait(Transform, { position: [0, 0.82, 0.01] }),
          trait(Sign, {
            text: "FIRE EXTINGUISHER",
            width: 0.3,
            height: 0.12,
            background: 0xc8102e,
            textColor: 0xffffff,
            font: "Arial, sans-serif",
          }),
        ],
      },
    ],
  };
}
