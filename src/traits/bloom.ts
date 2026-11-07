import { defineTrait } from "../core/trait.ts";

/**
 * Glow around bright things (lit windows, lasers, flashes). Only parts brighter
 * than `threshold` glow; `strength` and `radius` set how much and how far.
 * Put it on a room; the renderer applies it.
 */
export const Bloom = defineTrait({
  name: "bloom",
  defaults: { strength: 0.3, radius: 0.35, threshold: 0.92 },
  setup({ world, settings: s }) {
    return {
      update() {
        world.bloom = { strength: s.strength, radius: s.radius, threshold: s.threshold };
      },
      dispose() {
        world.bloom = null;
      },
    };
  },
});
