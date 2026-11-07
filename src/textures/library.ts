import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { Registry } from "../core/registry.ts";

/** Draws a seamless, tileable texture onto a square canvas of `size` pixels. */
export type TextureDrawer = (ctx: CanvasRenderingContext2D, size: number) => void;

/** Procedural textures by name. Modules in this folder register theirs. */
export const textures = new Registry<TextureDrawer>("texture");

const SIZE = 512;
const drawn = new Map<string, HTMLCanvasElement>();

/**
 * A repeating texture for `name`, or null without a canvas (e.g. headless tests).
 * The drawing is made once and shared; each call returns its own Texture so
 * callers can set their own repeat, and dispose it when done.
 */
export function makeTexture(name: string): Texture | null {
  const draw = textures.get(name); // throws for unknown names, even headless
  if (typeof document === "undefined") return null;
  let canvas = drawn.get(name);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    draw(ctx, SIZE);
    drawn.set(name, canvas);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
