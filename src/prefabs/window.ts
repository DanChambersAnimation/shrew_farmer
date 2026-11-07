import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";
import { slab } from "./blocks.ts";

const FRAME = 0xf6f4ee;
const GLASS = 0xd6e8f5;

/**
 * A window of `width` x `height` metres in its local XY plane, facing +z, with
 * narrow white frames dividing it into `columns` x `rows` panes. Centred on
 * `position`; `rotation` (degrees) turns it onto a wall.
 */
export function windowFrame(
  position: Vec3,
  rotation: Vec3,
  { width = 2.4, height = 3, columns = 3, rows = 4, bar = 0.05 } = {},
): ObjectSpec {
  const depth = 0.05;
  const bars: ObjectSpec[] = [];
  // Outer frame.
  bars.push(slab("frame", [width, bar * 1.6, depth], [0, height / 2, depth / 2], FRAME));
  bars.push(slab("frame", [width, bar * 1.6, depth], [0, -height / 2, depth / 2], FRAME));
  bars.push(slab("frame", [bar * 1.6, height, depth], [-width / 2, 0, depth / 2], FRAME));
  bars.push(slab("frame", [bar * 1.6, height, depth], [width / 2, 0, depth / 2], FRAME));
  // Glazing bars.
  for (let c = 1; c < columns; c++) {
    bars.push(
      slab(
        "glazing-bar",
        [bar, height, depth],
        [-width / 2 + (c * width) / columns, 0, depth / 2],
        FRAME,
      ),
    );
  }
  for (let r = 1; r < rows; r++) {
    bars.push(
      slab(
        "glazing-bar",
        [width, bar, depth],
        [0, -height / 2 + (r * height) / rows, depth / 2],
        FRAME,
      ),
    );
  }
  return {
    kind: "window",
    traits: [trait(Transform, { position, rotation })],
    children: [
      // Daylight through the glass: a soft self-lit pane.
      slab("glass", [width, height, 0.02], [0, 0, 0], GLASS, {
        emissive: GLASS,
        // Bright enough to glow with bloom.
        emissiveIntensity: 1.1,
        roughness: 0.1,
        castShadow: false,
      }),
      ...bars,
    ],
  };
}
