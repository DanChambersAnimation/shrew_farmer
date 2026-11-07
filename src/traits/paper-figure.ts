import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  type Intersection,
  Mesh,
  MeshStandardMaterial,
  type Raycaster,
  SRGBColorSpace,
} from "three";
import { defineTrait } from "../core/trait.ts";
import { rigs } from "../paper/library.ts";
import { type RigParams, type RigSelection, renderRig } from "../paper/rig.ts";

/** Texture pixels per rig unit. */
const RESOLUTION = 1.5;

/** A profile point: rig row `v` (rig units from the top) placed at local [y, z] metres. */
export type ProfilePoint = [v: number, y: number, z: number];

/**
 * Build the figure's surface. With no profile it's a flat upright panel with
 * the anchor at the origin. A profile bends it: each listed rig row is placed
 * at its [y, z], and the drawing runs straight between consecutive rows (e.g.
 * a seated figure folds forward at the hips and down at the knees).
 */
export function figureGeometry(
  width: number,
  height: number,
  scale: number,
  anchor: readonly [number, number],
  profile: readonly ProfilePoint[] = [],
): BufferGeometry {
  const points: readonly ProfilePoint[] =
    profile.length >= 2
      ? profile
      : [
          [0, anchor[1] * scale, 0],
          [height, (anchor[1] - height) * scale, 0],
        ];
  const [x0, x1] = [-anchor[0] * scale, (width - anchor[0]) * scale];
  const positions: number[] = [];
  const uvs: number[] = [];
  // One separate quad per segment, so each fold has a crisp edge.
  for (let i = 0; i + 1 < points.length; i++) {
    const [va, ya, za] = points[i]!;
    const [vb, yb, zb] = points[i + 1]!;
    const [ta, tb] = [1 - va / height, 1 - vb / height];
    // prettier-ignore
    positions.push(
      x0, ya, za,  x1, ya, za,  x0, yb, zb,
      x1, ya, za,  x1, yb, zb,  x0, yb, zb,
    );
    uvs.push(0, ta, 1, ta, 0, tb, 1, ta, 1, tb, 0, tb);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Shows a paper rig as a panel. `anchor` (in rig units) is placed at the
 * object's origin, e.g. a seated figure's hips or a standing figure's feet.
 * An optional `profile` bends the panel (see {@link figureGeometry}).
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
    /** Optional bend; see figureGeometry. Empty = flat. */
    profile: [] as ProfilePoint[],
  },
  setup({ object, settings: s }) {
    const rig = rigs.get(s.rig);
    const geometry = figureGeometry(rig.width, rig.height, s.scale, s.anchor, s.profile);
    // Double-sided: a bent figure shows faces at several angles.
    const material = new MeshStandardMaterial({ alphaTest: 0.5, roughness: 1, side: DoubleSide });
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
