import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  type Texture,
  Vector3,
} from "three";

const DOWN = new Vector3(0, -1, 0);

let fade: Texture | null | undefined;
/** Alpha that fades from the source (bright) to the far end (clear); shared. */
function fadeTexture(): Texture | null {
  if (fade !== undefined) return fade;
  fade = null;
  if (typeof document === "undefined") return fade;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fade;
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "#fff");
  gradient.addColorStop(0.6, "#555");
  gradient.addColorStop(1, "#000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 128);
  fade = new CanvasTexture(canvas);
  return fade;
}

/**
 * A visible shaft of light: a translucent, additive cone (or thin cylinder for
 * a laser) from the origin along a direction, fading toward its far end. Light
 * adds to what's behind it, so beams brighten with each other and with bloom.
 */
export class Beam {
  readonly mesh: Mesh;
  private readonly material: MeshBasicMaterial;
  private readonly cone: boolean;

  constructor(kind: "cone" | "ray") {
    this.cone = kind === "cone";
    // Unit-length shape, apex/start at the origin, pointing down -y.
    const geometry = this.cone
      ? new ConeGeometry(1, 1, 32, 1, true)
      : new CylinderGeometry(1, 1, 1, 6, 1, true);
    geometry.translate(0, -0.5, 0);
    this.material = new MeshBasicMaterial({
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
      alphaMap: this.cone ? fadeTexture() : null,
    });
    this.mesh = new Mesh(geometry, this.material);
    this.mesh.renderOrder = 10;
    // Beams are light in the air: never block the pointer or cast shadows.
    this.mesh.raycast = () => {};
    this.mesh.castShadow = false;
  }

  /**
   * Point along `direction` for `length` metres. `width` is the cone's half
   * angle in radians, or a laser's radius in metres.
   */
  set(direction: Vector3, length: number, width: number, color: number, opacity: number): void {
    const radius = this.cone ? length * Math.tan(width) : width;
    this.mesh.scale.set(radius, Math.max(length, 0.001), radius);
    this.mesh.quaternion.copy(
      new Quaternion().setFromUnitVectors(DOWN, direction.clone().normalize()),
    );
    this.material.color = new Color(color);
    this.material.opacity = Math.max(0, Math.min(1, opacity));
    this.mesh.visible = opacity > 0.002;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
