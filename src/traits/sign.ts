import { CanvasTexture, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { defineTrait } from "../core/trait.ts";

const PIXELS_PER_METRE = 256;

function css(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

/** Draws the sign text, or returns null where there is no 2D canvas (e.g. tests). */
function drawText(width: number, height: number, s: typeof Sign.defaults): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * PIXELS_PER_METRE);
  canvas.height = Math.round(height * PIXELS_PER_METRE);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = css(s.background);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = css(s.textColor);
  ctx.font = `bold ${Math.round(canvas.height * 0.5)}px ${s.font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.text, canvas.width / 2, canvas.height / 2, canvas.width * 0.9);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A flat rectangular sign with centred text, facing the object's +z. */
export const Sign = defineTrait({
  name: "sign",
  defaults: {
    text: "",
    width: 3,
    height: 0.8,
    background: 0xf4ecd8,
    textColor: 0x2b1d14,
    font: "Georgia, serif",
  },
  setup({ object, settings: s }) {
    const geometry = new PlaneGeometry(s.width, s.height);
    const texture = drawText(s.width, s.height, s);
    const material = new MeshStandardMaterial({
      color: texture ? 0xffffff : s.background,
      map: texture,
      roughness: 0.9,
    });
    const mesh = new Mesh(geometry, material);
    object.node.add(mesh);
    return () => {
      mesh.removeFromParent();
      geometry.dispose();
      material.dispose();
      texture?.dispose();
    };
  },
});
