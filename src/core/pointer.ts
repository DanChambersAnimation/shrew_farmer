import { Raycaster, Vector2, type Vector3 } from "three";
import { GameObject } from "./game-object.ts";
import type { World } from "./world.ts";

/**
 * Pointer events emitted on game objects. Traits subscribe to these; the
 * pointer system never decides what an interaction means.
 */
export const POINTER = {
  /** The pointer moved onto this object or one of its descendants. */
  enter: "pointer:enter",
  /** The pointer moved off this object and all of its descendants. */
  leave: "pointer:leave",
  /** A click landed on this object or one of its descendants. */
  click: "pointer:click",
} as const;

export interface PointerEvent {
  /** The innermost object under the pointer. */
  readonly target: GameObject;
  /** World-space point where the pointer ray hit. */
  readonly point: Vector3;
}

interface Hit {
  readonly target: GameObject;
  readonly point: Vector3;
}

/**
 * Finds the object under the pointer (nearest surface wins, so solid objects
 * block what is behind them) and sends it and its ancestors pointer events,
 * like DOM mouseenter/mouseleave and bubbling clicks.
 */
export class PointerSystem {
  private readonly raycaster = new Raycaster();
  private readonly world: World;
  private hit: Hit | null = null;
  /** Hovered chain, innermost first. */
  private hovered: GameObject[] = [];

  constructor(world: World) {
    this.world = world;
  }

  /** Move the pointer to normalized device coords (-1..1), or null when it leaves the view. */
  move(ndc: { x: number; y: number } | null): void {
    this.hit = ndc ? this.pick(ndc) : null;
    const chain = this.hit ? this.hit.target.ancestry() : [];
    const payload = this.hit ?? undefined;
    for (const obj of this.hovered) {
      if (!chain.includes(obj)) obj.emit(POINTER.leave, payload);
    }
    for (const obj of [...chain].reverse()) {
      if (!this.hovered.includes(obj)) obj.emit(POINTER.enter, payload);
    }
    this.hovered = chain;
  }

  /** Click at the current pointer position. Bubbles from the target to the root. */
  click(): void {
    if (!this.hit) return;
    const event: PointerEvent = this.hit;
    for (const obj of event.target.ancestry()) obj.emit(POINTER.click, event);
  }

  /** The innermost hovered object, if any. */
  get target(): GameObject | null {
    return this.hit?.target ?? null;
  }

  /** Whether anything under the pointer reacts to it (e.g. to show a hand cursor). */
  get interactive(): boolean {
    return this.hovered.some((o) => o.listens(POINTER.enter) || o.listens(POINTER.click));
  }

  /** Forget hover state without emitting events (e.g. after the room is replaced). */
  reset(): void {
    this.hit = null;
    this.hovered = [];
  }

  private pick(ndc: { x: number; y: number }): Hit | null {
    const { scene } = this.world;
    const camera = this.world.viewCamera;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera);
    for (const hit of this.raycaster.intersectObject(scene, true)) {
      const target = GameObject.owning(hit.object);
      if (target) return { target, point: hit.point };
    }
    return null;
  }
}
