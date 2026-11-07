import { Euler, MathUtils, type PerspectiveCamera, Vector3 } from "three";

/** Keys, by KeyboardEvent.code, mapped to a movement direction in camera space. */
const MOVES: Record<string, [number, number, number]> = {
  KeyW: [0, 0, -1],
  KeyS: [0, 0, 1],
  KeyA: [-1, 0, 0],
  KeyD: [1, 0, 0],
  KeyE: [0, 1, 0],
  KeyQ: [0, -1, 0],
};

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Free-fly camera for positioning shots: WASD to move, Q/E down/up, Shift to go
 * faster, mouse to look (pointer-locked), wheel to zoom. `settings()` gives the
 * current view in the shape CameraView takes.
 */
export class Noclip {
  active = false;
  speed = 3;
  private readonly camera: PerspectiveCamera;
  private readonly held = new Set<string>();
  private readonly euler = new Euler(0, 0, 0, "YXZ");

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
  }

  toggle(): void {
    this.active = !this.active;
    this.held.clear();
    if (this.active) this.euler.setFromQuaternion(this.camera.quaternion, "YXZ");
  }

  press(code: string): void {
    if (this.active) this.held.add(code);
  }

  release(code: string): void {
    this.held.delete(code);
  }

  /** Forget held keys (e.g. when the window loses focus mid-press). */
  releaseAll(): void {
    this.held.clear();
  }

  /** Mouse movement in pixels. */
  look(dx: number, dy: number): void {
    if (!this.active) return;
    this.euler.y -= dx * 0.0025;
    this.euler.x = MathUtils.clamp(this.euler.x - dy * 0.0025, -1.55, 1.55);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  zoom(delta: number): void {
    if (!this.active) return;
    this.camera.fov = MathUtils.clamp(this.camera.fov + delta, 15, 100);
    this.camera.updateProjectionMatrix();
  }

  update(dt: number): void {
    if (!this.active) return;
    const move = new Vector3();
    for (const code of this.held) {
      const dir = MOVES[code];
      if (dir) move.add(new Vector3(...dir));
    }
    if (move.lengthSq() === 0) return;
    const fast = this.held.has("ShiftLeft") || this.held.has("ShiftRight");
    move.normalize().multiplyScalar(this.speed * (fast ? 3 : 1) * dt);
    // Horizontal moves follow the view direction; Q/E stay vertical.
    const up = move.y;
    move.y = 0;
    move.applyQuaternion(this.camera.quaternion);
    move.y += up;
    this.camera.position.add(move);
  }

  /** The current view as CameraView settings (lookAt is 10 m ahead). */
  settings(): { position: number[]; lookAt: number[]; fov: number } {
    const forward = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const target = this.camera.position.clone().addScaledVector(forward, 10);
    return {
      position: this.camera.position.toArray().map(round),
      lookAt: target.toArray().map(round),
      fov: round(this.camera.fov),
    };
  }

  /** Settings as a snippet to paste into a room's CameraView. */
  snippet(): string {
    const s = this.settings();
    return `position: [${s.position.join(", ")}], lookAt: [${s.lookAt.join(", ")}], fov: ${s.fov}`;
  }
}
