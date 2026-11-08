import { defineTrait } from "../core/trait.ts";

/**
 * How much bright things glow in this room (0 = none; the settings panel's
 * slider runs 0–0.1). Glow itself is drawn by Glow cards on the bright things.
 */
export const Bloom = defineTrait({
  name: "bloom",
  defaults: { strength: 0.05 },
  setup({ world, settings: s }) {
    return {
      update() {
        world.bloom = { strength: s.strength };
      },
      dispose() {
        world.bloom = null;
      },
    };
  },
});
