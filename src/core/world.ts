import { PerspectiveCamera, Scene } from "three";
import { Emitter } from "./emitter.ts";
import { GameObject } from "./game-object.ts";
import { PointerSystem } from "./pointer.ts";

/** Shared services every object and trait can reach, plus the current root object. */
export class World {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(50, 1, 0.1, 200);
  /** World-wide events, e.g. for the UI layer outside the 3D scene. */
  readonly events = new Emitter();
  readonly pointer = new PointerSystem(this);
  private root: GameObject | null = null;

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
    this.root?.dispose();
    this.root = null;
  }

  update(dt: number): void {
    this.root?.update(dt);
  }
}
