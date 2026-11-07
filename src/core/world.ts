import {
  type Camera,
  MathUtils,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Ray,
  Scene,
  Vector3,
} from "three";
import { Emitter } from "./emitter.ts";
import { GameObject } from "./game-object.ts";
import { PointerSystem } from "./pointer.ts";

/** Shared services every object and trait can reach, plus the current root object. */
export class World {
  readonly scene = new Scene();
  /** The camera everything positions and aims (field of view included). */
  readonly camera = new PerspectiveCamera(50, 1, 0.1, 200);
  /** Mirrors `camera` with a flat projection when `projection` is "orthographic". */
  readonly orthoCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  projection: "perspective" | "orthographic" = "perspective";
  /** World-wide events, e.g. for the UI layer outside the 3D scene. */
  readonly events = new Emitter();
  readonly pointer = new PointerSystem(this);
  /** Haze in the air (0 = clear). Makes light beams visible (see Haze, Light's `beam`). */
  haze = 0;
  /** Glow around bright things, or null for none (see the Bloom trait). */
  bloom: { strength: number; radius: number; threshold: number } | null = null;
  /** Brightness (0..1) of each named light group; groups not listed are at 1. */
  readonly lightLevels = new Map<string, number>();
  /** True while something outside the game (e.g. noclip) is steering the camera. */
  manualCamera = false;
  private root: GameObject | null = null;

  /** The camera to render and pick with, for the current projection. */
  get viewCamera(): Camera {
    if (this.projection === "perspective") return this.camera;
    this.syncOrtho();
    return this.orthoCamera;
  }

  /**
   * Match the ortho camera to the perspective one: same pose, and a frustum the
   * size of the perspective view at the point it looks at on the floor (y = 0),
   * so switching projection keeps that point framed the same.
   */
  private syncOrtho(): void {
    const { camera, orthoCamera: ortho } = this;
    camera.updateMatrixWorld();
    ortho.position.copy(camera.position);
    ortho.quaternion.copy(camera.quaternion);
    const forward = camera.getWorldDirection(new Vector3());
    const hit = new Ray(camera.position, forward).intersectPlane(
      new Plane(new Vector3(0, 1, 0), 0),
      new Vector3(),
    );
    const distance = hit ? hit.distanceTo(camera.position) : 10;
    const halfHeight = distance * Math.tan(MathUtils.degToRad(camera.fov / 2));
    const halfWidth = halfHeight * camera.aspect;
    ortho.left = -halfWidth;
    ortho.right = halfWidth;
    ortho.top = halfHeight;
    ortho.bottom = -halfHeight;
    ortho.near = camera.near;
    ortho.far = camera.far;
    ortho.updateProjectionMatrix();
    ortho.updateMatrixWorld();
  }

  get current(): GameObject | null {
    return this.root;
  }

  /** Create a fresh root object, disposing the previous one first. */
  createRoot(kind: string): GameObject {
    this.clear();
    const root = new GameObject(kind, this);
    this.root = root;
    this.scene.add(root.node);
    return root;
  }

  clear(): void {
    this.pointer.reset();
    this.lightLevels.clear();
    this.haze = 0;
    this.bloom = null;
    this.root?.dispose();
    this.root = null;
  }

  update(dt: number): void {
    this.root?.update(dt);
  }
}
