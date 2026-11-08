import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { GroupGlow } from "../traits/day-night.ts";
import { Light } from "../traits/light.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const SODIUM = 0xffa040;

/**
 * A streetlight standing at `position`: a dark post `height` m tall with an
 * arm reaching toward +x (turn with `rotation`), a lamp head whose bulb glows,
 * and a real orange sodium light. Both follow the "streetlight" light group.
 */
export function streetlight(position: Vec3, rotation: Vec3 = [0, 0, 0], height = 3.6): ObjectSpec {
  const cylinder = { shape: "cylinder" as const };
  return {
    kind: "streetlight",
    traits: [trait(Transform, { position, rotation })],
    children: [
      slab("post", [0.1, height, 0.1], [0, height / 2, 0], 0x2a2c2e, {
        ...cylinder,
        metalness: 0.5,
      }),
      slab("arm", [0.7, 0.06, 0.06], [0.35, height - 0.05, 0], 0x2a2c2e, { metalness: 0.5 }),
      slab("head", [0.45, 0.12, 0.22], [0.65, height - 0.12, 0], 0x2a2c2e, { metalness: 0.4 }),
      {
        kind: "bulb",
        traits: [
          trait(Transform, { position: [0.65, height - 0.2, 0] }),
          trait(GroupGlow, { group: "streetlight", intensity: 3 }),
        ],
        children: [
          slab("lens", [0.36, 0.04, 0.16], [0, 0, 0], SODIUM, {
            emissive: SODIUM,
            castShadow: false,
          }),
        ],
      },
      {
        kind: "lamp",
        traits: [
          trait(Transform, { position: [0.65, height - 0.3, 0] }),
          trait(Light, {
            kind: "point",
            color: SODIUM,
            intensity: 18,
            distance: 9,
            group: "streetlight",
          }),
        ],
      },
    ],
  };
}
