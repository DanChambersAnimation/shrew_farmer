import { Color, Mesh, MeshStandardMaterial, type Texture } from "three";
import { Random } from "../core/random.ts";
import { defineTrait } from "../core/trait.ts";
import { makeTexture } from "../textures/index.ts";

/**
 * Makes an object's surfaces look like glass with the outside behind it,
 * following the world's day/night setting: the `day` and `night` textures glow
 * through (night's streetlight glow is bright enough to bloom). Each window
 * shows a slightly different part of the view, chosen by `seed`.
 */
export const WindowGlass = defineTrait({
  name: "window-glass",
  defaults: {
    day: "sky-day",
    night: "sky-night",
    dayGlow: 1.1,
    nightGlow: 1.0,
    seed: 1,
  },
  setup({ object, world, settings: s }) {
    const materials: MeshStandardMaterial[] = [];
    object.node.traverse((node) => {
      if (node instanceof Mesh && node.material instanceof MeshStandardMaterial) {
        materials.push(node.material);
      }
    });
    const rng = new Random(s.seed);
    const shift = (texture: Texture | null) => {
      texture?.offset.set((rng.next() - 0.5) * 0.5, (rng.next() - 0.5) * 0.15);
      return texture;
    };
    const views = { day: shift(makeTexture(s.day)), night: shift(makeTexture(s.night)) };
    let shown: string | null = null;
    const show = () => {
      if (shown === world.outside) return;
      shown = world.outside;
      const night = world.outside === "night";
      for (const m of materials) {
        m.color = new Color(night ? 0x10121a : 0xd6e8f5);
        m.emissive = new Color(0xffffff);
        m.emissiveMap = night ? views.night : views.day;
        m.emissiveIntensity = night ? s.nightGlow : s.dayGlow;
        m.needsUpdate = true;
      }
    };
    show();
    return {
      update: show,
      dispose() {
        views.day?.dispose();
        views.night?.dispose();
      },
    };
  },
});
