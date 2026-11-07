import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

/**
 * Marks the object as somewhere to sit. `sitPoint` (in the object's space) is
 * where a sitter's seat anchor goes. Rooms decide who sits where.
 */
export const Seat = defineTrait({
  name: "seat",
  defaults: { sitPoint: [0, 0.4, 0] as Vec3 },
});
