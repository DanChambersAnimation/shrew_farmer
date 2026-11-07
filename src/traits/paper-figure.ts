import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Float32BufferAttribute,
  type Intersection,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  RGBADepthPacking,
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
 * A twist about the vertical axis by up to `degrees` (positive = anticlockwise
 * seen from above). `curve` lists [rig row, fraction of the twist] pairs; rows
 * between pairs blend smoothly, rows beyond the ends take the end values. E.g.
 * waist 0, shoulders 0.5, neck 1: the body turns half way, the head fully.
 */
export interface Twist {
  degrees: number;
  curve: [v: number, amount: number][];
}

const NO_TWIST: Twist = { degrees: 0, curve: [] };

/** Rig units between generated rows where the shape changes (twists). */
const ROW_STEP = 6;
/** Columns across the figure, so twisted rows bend smoothly. */
const COLUMNS = 8;

/** [y, z] of rig row `v`, interpolated along the profile. */
function placeRow(points: readonly ProfilePoint[], v: number): [number, number] {
  for (let i = 0; i + 1 < points.length; i++) {
    const [va, ya, za] = points[i]!;
    const [vb, yb, zb] = points[i + 1]!;
    if (v >= va && v <= vb) {
      const t = vb === va ? 0 : (v - va) / (vb - va);
      return [ya + (yb - ya) * t, za + (zb - za) * t];
    }
  }
  const [, y, z] = v < points[0]![0] ? points[0]! : points.at(-1)!;
  return [y, z];
}

/** Fraction of the twist at rig row `v`, smoothly interpolated along the curve. */
function twistAmount(curve: Twist["curve"], v: number): number {
  if (curve.length === 0) return 0;
  const sorted = [...curve].sort((a, b) => a[0] - b[0]);
  if (v <= sorted[0]![0]) return sorted[0]![1];
  for (let i = 0; i + 1 < sorted.length; i++) {
    const [va, aa] = sorted[i]!;
    const [vb, ab] = sorted[i + 1]!;
    if (v <= vb) {
      const t = (v - va) / (vb - va);
      return aa + (ab - aa) * (t * t * (3 - 2 * t)); // smoothstep: no kinks at the ends
    }
  }
  return sorted.at(-1)![1];
}

/**
 * Build the figure's surface: a smooth grid over the drawing. With no profile
 * it's a flat upright panel with the anchor at the origin. A profile bends it:
 * each listed rig row is placed at its [y, z], straight in between, with a crisp
 * fold at each interior point (e.g. a seated figure folds at the hips and
 * knees). A twist then turns rows about the vertical axis through the anchor.
 */
export function figureGeometry(
  width: number,
  height: number,
  scale: number,
  anchor: readonly [number, number],
  profile: readonly ProfilePoint[] = [],
  twist: Twist = NO_TWIST,
): BufferGeometry {
  const points: readonly ProfilePoint[] =
    profile.length >= 2
      ? profile
      : [
          [0, anchor[1] * scale, 0],
          [height, (anchor[1] - height) * scale, 0],
        ];
  const inRange = (v: number) => v >= 0 && v <= height;
  // Folds split the figure into strips; each strip is a smooth grid.
  const folds = [...new Set([0, height, ...points.slice(1, -1).map(([v]) => v)])]
    .filter(inRange)
    .sort((a, b) => a - b);
  // Extra rows wherever the twist changes, so it bends smoothly.
  const curveRows = twist.curve.map(([v]) => v).filter(inRange);
  const twistRows: number[] = [];
  if (twist.degrees !== 0 && curveRows.length >= 2) {
    const [lo, hi] = [Math.min(...curveRows), Math.max(...curveRows)];
    for (let v = lo; v <= hi; v += ROW_STEP) twistRows.push(v);
    twistRows.push(hi);
  }
  const [x0, x1] = [-anchor[0] * scale, (width - anchor[0]) * scale];
  const radians = (twist.degrees * Math.PI) / 180;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let f = 0; f + 1 < folds.length; f++) {
    const [top, bottom] = [folds[f]!, folds[f + 1]!];
    const rows = [...new Set([top, bottom, ...curveRows, ...twistRows])]
      .filter((v) => v >= top && v <= bottom)
      .sort((a, b) => a - b);
    const first = positions.length / 3;
    for (const v of rows) {
      const [y, z] = placeRow(points, v);
      const angle = radians * twistAmount(twist.curve, v);
      const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
      for (let c = 0; c <= COLUMNS; c++) {
        const u = c / COLUMNS;
        const x = x0 + (x1 - x0) * u;
        positions.push(x * cos, y, z - x * sin);
        uvs.push(u, 1 - v / height);
      }
    }
    const stride = COLUMNS + 1;
    for (let r = 0; r + 1 < rows.length; r++) {
      for (let c = 0; c < COLUMNS; c++) {
        const a = first + r * stride + c;
        const b = a + stride;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Shows a paper rig as a panel. `anchor` (in rig units) is placed at the
 * object's origin, e.g. a seated figure's hips or a standing figure's feet.
 * An optional `profile` bends the panel and `twist` turns its upper part
 * (see {@link figureGeometry}).
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
    /** Cast a shadow in the drawing's outline (lights must cast shadows too). */
    castShadow: false,
    /**
     * How much the drawing lights itself, regardless of the room's lights
     * (0 = fully lit by the scene). A cheat that keeps faces readable in the dark.
     */
    selfLight: 0,
    /** Optional twist of the upper body; change it at any time. */
    twist: { degrees: 0, curve: [] } as Twist,
  },
  setup({ object, settings: s }) {
    const rig = rigs.get(s.rig);
    const shape = () =>
      figureGeometry(rig.width, rig.height, s.scale, s.anchor, s.profile, s.twist);
    const shapeKey = () => JSON.stringify([s.scale, s.anchor, s.profile, s.twist]);
    let geometry = shape();
    let shapedKey = shapeKey();
    // Double-sided: a bent figure shows faces at several angles.
    const material = new MeshStandardMaterial({ alphaTest: 0.5, roughness: 1, side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    // Shadows use the drawing's alpha, so they're figure-shaped, not rectangles.
    const shadowMaterial = new MeshDepthMaterial({
      depthPacking: RGBADepthPacking,
      alphaTest: 0.5,
      side: DoubleSide,
    });
    mesh.castShadow = s.castShadow;
    mesh.customDepthMaterial = shadowMaterial;
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
        // Self-light: the drawing glows with its own colours.
        material.emissive.set(0xffffff);
        material.emissiveMap = texture;
        material.emissiveIntensity = s.selfLight;
        material.needsUpdate = true;
        shadowMaterial.map = texture;
        shadowMaterial.needsUpdate = true;
        mesh.visible = true;
      };
      image.onerror = () => console.error(`PaperFigure: rig "${s.rig}" produced an invalid SVG`);
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };
    draw();

    return {
      update() {
        if (JSON.stringify([s.slots, s.params]) !== drawnKey) draw();
        if (shapeKey() !== shapedKey) {
          geometry.dispose();
          geometry = shape();
          mesh.geometry = geometry;
          shapedKey = shapeKey();
        }
      },
      dispose() {
        alive = false;
        mesh.removeFromParent();
        geometry.dispose();
        material.map?.dispose();
        material.dispose();
        shadowMaterial.dispose();
      },
    };
  },
});
