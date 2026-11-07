import { Color, FogExp2 } from "three";
import { defineTrait } from "../core/trait.ts";

/**
 * A slight haze in the room's air: gentle distance fog, and enough particles in
 * the air for light beams to show (Light's `beam`, Laser). `amount` scales how
 * strongly beams show; `density` is the fog's thickness.
 */
export const Haze = defineTrait({
  name: "haze",
  defaults: { amount: 1, density: 0.012, color: 0x3a3530 },
  setup({ world, settings: s }) {
    const previous = world.scene.fog;
    const fog = new FogExp2(new Color(s.color), s.density);
    world.scene.fog = fog;
    return {
      update() {
        world.haze = s.amount;
        fog.density = s.density;
        fog.color.setHex(s.color);
      },
      dispose() {
        world.scene.fog = previous;
        world.haze = 0;
      },
    };
  },
});
