import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Texture,
  Vector3,
} from "three";
import { defineTrait } from "../core/trait.ts";

export type GlowShape = "round" | "rect";

const fades = new Map<GlowShape, Texture | null>();
/** Soft alpha falloff: a radial blob, or a rectangle with feathered edges. Shared. */
function fadeTexture(shape: GlowShape): Texture | null {
  if (fades.has(shape)) return fades.get(shape)!;
  let texture: Texture | null = null;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (shape === "round") {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, "#fff");
        g.addColorStop(0.3, "#888");
        g.addColorStop(1, "#000");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
      } else {
        // Feathered rectangle: blur a white box drawn inset from the edges.
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 128, 128);
        ctx.filter = "blur(14px)";
        ctx.fillStyle = "#fff";
        ctx.fillRect(26, 26, 76, 76);
      }
      texture = new CanvasTexture(canvas);
    }
  }
  fades.set(shape, texture);
  return texture;
}

/**
 * A soft halo of light around the object: a cheap stand-in for bloom, drawn
 * as an additive card, so bright things glow without any post-processing.
 * "round" cards always face the camera (lamps, laser sources); "rect" cards lie
 * flat facing the object's +z (windows). Brightness = `intensity` x the room's
 * glow amount (the Bloom trait) x the level of light `group`, if set.
 */
export const Glow = defineTrait({
  name: "glow",
  defaults: {
    shape: "round" as GlowShape,
    /** Card size, metres [width, height]. */
    size: [1, 1] as [number, number],
    color: 0xffffff,
    intensity: 1,
    group: "",
    /** Offset from the object's origin, local metres. */
    offset: [0, 0, 0] as [number, number, number],
  },
  setup({ object, world, settings: s }) {
    const material = new MeshBasicMaterial({
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      alphaMap: fadeTexture(s.shape),
      fog: false,
    });
    const card = new Mesh(new PlaneGeometry(s.size[0], s.size[1]), material);
    card.position.set(...s.offset);
    card.renderOrder = 11;
    card.raycast = () => {};
    object.node.add(card);
    const camera = new Vector3();
    return {
      update() {
        const level = s.group ? (world.lightLevels.get(s.group) ?? 1) : 1;
        // The Bloom trait's strength (0–0.1 on the slider) scales every glow.
        const amount = (world.bloom?.strength ?? 0) * 10;
        material.opacity = Math.min(1, s.intensity * amount * level);
        material.color = new Color(s.color);
        card.visible = material.opacity > 0.002;
        if (s.shape === "round" && card.visible) {
          // Face the camera regardless of how the object is turned.
          world.camera.getWorldPosition(camera);
          card.lookAt(camera);
        }
      },
      dispose() {
        card.removeFromParent();
        card.geometry.dispose();
        material.dispose();
      },
    };
  },
});
