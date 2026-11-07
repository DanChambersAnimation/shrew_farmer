import {
  CanvasTexture,
  type Intersection,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Raycaster,
  SRGBColorSpace,
} from "three";
import { defineTrait } from "../core/trait.ts";
import { rigs } from "../paper/library.ts";
import { type RigParams, type RigSelection, renderRig } from "../paper/rig.ts";

/** Texture pixels per rig unit. */
const RESOLUTION = 1.5;

/**
 * Shows a paper rig as a flat panel. `anchor` (in rig units) is placed at the
 * object's origin, e.g. a seated figure's hips or a standing figure's feet.
 * Change `slots` or `params` at any time and the figure redraws.
 * Transparent parts of the drawing don't block the pointer.
 */
export const PaperFigure = defineTrait({
  name: "paper-figure",
  defaults: {
    rig: "",
    slots: {} as RigSelection,
    params: {} as RigParams,
    /** Metres per rig unit. */
    scale: 0.004,
    anchor: [0, 0] as [number, number],
  },
  setup({ object, settings: s }) {
    const rig = rigs.get(s.rig);
    const [w, h] = [rig.width * s.scale, rig.height * s.scale];
    const geometry = new PlaneGeometry(w, h);
    // Shift so the anchor point sits at the origin.
    geometry.translate(w / 2 - s.anchor[0] * s.scale, -h / 2 + s.anchor[1] * s.scale, 0);
    const material = new MeshStandardMaterial({ alphaTest: 0.5, roughness: 1 });
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    object.node.add(mesh);

    let pixels: ImageData | null = null;
    let drawnKey = "";
    let alive = true;

    // Ignore hits on transparent pixels so you can point "between" figures.
    mesh.raycast = (raycaster: Raycaster, hits: Intersection[]) => {
      const before = hits.length;
      Mesh.prototype.raycast.call(mesh, raycaster, hits);
      for (let i = hits.length - 1; i >= before; i--) {
        const uv = hits[i]!.uv;
        if (!pixels || !uv) continue;
        const x = Math.min(pixels.width - 1, Math.floor(uv.x * pixels.width));
        const y = Math.min(pixels.height - 1, Math.floor((1 - uv.y) * pixels.height));
        if (pixels.data[(y * pixels.width + x) * 4 + 3]! < 128) hits.splice(i, 1);
      }
    };

    const draw = () => {
      drawnKey = JSON.stringify([s.slots, s.params]);
      const svg = renderRig(rig, s.slots, undefined, s.params) // validates slots and params
        // Browsers need an intrinsic size to draw an SVG image onto a canvas.
        .replace("<svg ", `<svg width="${rig.width}" height="${rig.height}" `);
      if (typeof Image === "undefined" || typeof document === "undefined") return; // headless
      const key = drawnKey;
      const image = new Image();
      image.onload = () => {
        if (!alive || key !== drawnKey) return; // disposed or superseded by a newer draw
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(rig.width * RESOLUTION);
        canvas.height = Math.round(rig.height * RESOLUTION);
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        material.map?.dispose();
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
        mesh.visible = true;
      };
      image.onerror = () => console.error(`PaperFigure: rig "${s.rig}" produced an invalid SVG`);
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };
    draw();

    return {
      update() {
        if (JSON.stringify([s.slots, s.params]) !== drawnKey) draw();
      },
      dispose() {
        alive = false;
        mesh.removeFromParent();
        geometry.dispose();
        material.map?.dispose();
        material.dispose();
      },
    };
  },
});
