import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Light } from "../traits/light.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

/**
 * A shadow-casting spotlight hung at `from`, aimed at `to` (both world space).
 * It belongs to light `group` (default "spot") so lighting cues can fade it.
 */
export function spotlight(
  from: Vec3,
  to: Vec3,
  options: { intensity?: number; angle?: number; group?: string } = {},
): ObjectSpec {
  return {
    kind: "spotlight",
    traits: [
      trait(Transform, { position: from }),
      trait(Light, {
        kind: "spot",
        color: 0xfff1d6,
        intensity: options.intensity ?? 150,
        angle: options.angle ?? 16,
        penumbra: 0.4,
        target: [to[0] - from[0], to[1] - from[1], to[2] - from[2]],
        castShadow: true,
        group: options.group ?? "spot",
      }),
    ],
  };
}
