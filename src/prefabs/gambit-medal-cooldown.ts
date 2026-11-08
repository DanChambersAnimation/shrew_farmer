import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import type { MedalDef } from "../gambits/effect.ts";

/** A clock-face veil and countdown that belong to the medal's 3D group. */
export function createMedalCooldown(shape: MedalDef["shape"]) {
  const group = new Group();
  group.visible = false;
  const geometry = new PlaneGeometry(1.04, 1.04);
  const veil = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      sweep: { value: 0 },
      roundMedal: { value: shape === "round" ? 1 : 0 },
    },
    vertexShader: `
      varying vec2 medalUv;
      void main() {
        medalUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 medalUv;
      uniform float sweep;
      uniform float roundMedal;
      void main() {
        vec2 point = medalUv - vec2(0.5);
        if (roundMedal > 0.5 && length(point) > 0.48) discard;
        // atan(x, y) measures clockwise from twelve o'clock.
        float angle = mod(atan(point.x, point.y) + 6.2831853, 6.2831853);
        if (angle < sweep) discard;
        gl_FragColor = vec4(0.11, 0.11, 0.14, 0.78);
      }
    `,
  });
  const sector = new Mesh(geometry, veil);
  sector.position.z = 0.32;
  group.add(sector);

  let number = -1;
  let count: Mesh | null = null;
  let countGeometry: PlaneGeometry | null = null;
  let countMaterial: MeshBasicMaterial | null = null;
  let texture: CanvasTexture | null = null;
  let canvas: HTMLCanvasElement | null = null;

  function showNumber(seconds: number) {
    if (number === seconds) return;
    number = seconds;
    if (typeof document === "undefined") return;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      texture = new CanvasTexture(canvas);
      countGeometry = new PlaneGeometry(0.82, 0.82);
      countMaterial = new MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      count = new Mesh(countGeometry, countMaterial);
      count.position.z = 0.34;
      group.add(count);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 128, 128);
    ctx.font = "900 74px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#211529";
    ctx.strokeText(String(seconds), 64, 69);
    ctx.fillStyle = "#fff8df";
    ctx.fillText(String(seconds), 64, 69);
    texture!.needsUpdate = true;
  }

  return {
    group,
    set(remainingSeconds: number, durationSeconds: number) {
      group.visible = remainingSeconds > 0 && durationSeconds > 0;
      if (!group.visible) return;
      veil.uniforms.sweep!.value = Math.PI * 2 * (1 - remainingSeconds / durationSeconds);
      showNumber(Math.ceil(remainingSeconds));
    },
    dispose() {
      geometry.dispose();
      veil.dispose();
      countGeometry?.dispose();
      countMaterial?.dispose();
      texture?.dispose();
    },
  };
}
