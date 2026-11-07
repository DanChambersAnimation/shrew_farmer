import { Color, Mesh, MeshStandardMaterial } from "three";
import { POINTER } from "../core/pointer.ts";
import { defineTrait } from "../core/trait.ts";

/** Makes the object (and everything under it) glow while hovered. */
export const Highlight = defineTrait({
  name: "highlight",
  defaults: { color: 0xffe9a8, intensity: 0.35 },
  setup({ object, settings }) {
    const saved = new Map<MeshStandardMaterial, { color: Color; intensity: number }>();
    const glow = new Color(settings.color);
    const on = () => {
      object.node.traverse((node) => {
        if (!(node instanceof Mesh) || !(node.material instanceof MeshStandardMaterial)) return;
        const m = node.material;
        if (!saved.has(m))
          saved.set(m, { color: m.emissive.clone(), intensity: m.emissiveIntensity });
        if (m.emissiveMap) {
          // Already glowing with its own picture (e.g. a self-lit figure): glow more.
          m.emissiveIntensity = saved.get(m)!.intensity + settings.intensity;
        } else {
          m.emissive.copy(glow);
          m.emissiveIntensity = settings.intensity;
        }
      });
    };
    const off = () => {
      for (const [m, s] of saved) {
        m.emissive.copy(s.color);
        m.emissiveIntensity = s.intensity;
      }
      saved.clear();
    };
    const offEnter = object.on(POINTER.enter, on);
    const offLeave = object.on(POINTER.leave, off);
    return () => {
      offEnter();
      offLeave();
      off();
    };
  },
});
