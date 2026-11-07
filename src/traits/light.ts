import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  type Light as ThreeLight,
  MathUtils,
  PointLight,
  SpotLight,
  SRGBColorSpace,
  type Texture,
  Vector3,
} from "three";
import { defineTrait } from "../core/trait.ts";
import { Beam } from "../render/beam.ts";
import type { Vec3 } from "./types.ts";

export type LightKind = "ambient" | "hemisphere" | "directional" | "point" | "spot";

/** Named patterns a spot light can project (needs a canvas, so skipped headless). */
export type LightPattern = "" | "dots";

function patternTexture(pattern: LightPattern): Texture | null {
  if (!pattern || typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#fff";
  // A fixed scatter of small dots, like light off a mirror ball.
  for (let i = 0; i < 140; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 12345.6789) % 1;
    ctx.beginPath();
    ctx.arc(Math.abs(x) * 256, Math.abs(y) * 256, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Emits light from the object's origin. `target` is in the object's local space
 * and applies to directional and spot lights.
 *
 * A light in a `group` (e.g. "house") is scaled by the world's level for that
 * group (see LightingCues), fading over `fade` seconds when the level changes.
 *
 * `color`, `target` and `scale` (a brightness multiplier) are applied live, so
 * other traits can animate them (see Pulse, Sweep, ColorCycle). A spot light
 * can project a `pattern` (e.g. "dots" for a mirror ball).
 *
 * A spot light with `beam` > 0 also shows its shaft of light in the air, when
 * the room has haze (see Haze), down to the floor.
 */
export const Light = defineTrait({
  name: "light",
  defaults: {
    kind: "point" as LightKind,
    color: 0xffffff,
    /** Hemisphere lights only. */
    groundColor: 0x444444,
    intensity: 1,
    distance: 0,
    /** Spot lights only, degrees. */
    angle: 30,
    penumbra: 0.3,
    target: [0, 0, -1] as Vec3,
    castShadow: false,
    group: "",
    fade: 0.8,
    /** Live brightness multiplier, for animation traits. */
    scale: 1,
    /** Spot lights only: a projected pattern. Projection needs shadows, so it turns them on. */
    pattern: "" as LightPattern,
    /** Spot lights only: how visible the beam is in hazy air (0 = never). */
    beam: 0,
  },
  setup({ object, world, settings: s }) {
    let light: ThreeLight;
    switch (s.kind) {
      case "ambient":
        light = new AmbientLight(s.color, s.intensity);
        break;
      case "hemisphere":
        light = new HemisphereLight(s.color, s.groundColor, s.intensity);
        break;
      case "point":
        light = new PointLight(s.color, s.intensity, s.distance);
        break;
      case "directional":
      case "spot": {
        const aimed =
          s.kind === "spot"
            ? new SpotLight(
                s.color,
                s.intensity,
                s.distance,
                MathUtils.degToRad(s.angle),
                s.penumbra,
              )
            : new DirectionalLight(s.color, s.intensity);
        aimed.target.position.set(...s.target);
        object.node.add(aimed.target);
        light = aimed;
        break;
      }
    }
    const map = light instanceof SpotLight ? patternTexture(s.pattern) : null;
    if (map && light instanceof SpotLight) light.map = map;
    if (
      (s.castShadow || map) &&
      (light instanceof DirectionalLight ||
        light instanceof SpotLight ||
        light instanceof PointLight)
    ) {
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.0005;
    }
    // three.js puts some lights 1 m above their origin by default; we want the
    // light exactly where its object is.
    light.position.set(0, 0, 0);
    object.node.add(light);
    const levelNow = () => (s.group ? (world.lightLevels.get(s.group) ?? 1) : 1);
    let level = levelNow();
    const beam = light instanceof SpotLight && s.beam > 0 ? new Beam("cone") : null;
    if (beam) object.node.add(beam.mesh);
    const origin = new Vector3();
    const apply = () => {
      light.intensity = s.intensity * level * s.scale;
      light.color.setHex(s.color);
      if (light instanceof SpotLight || light instanceof DirectionalLight) {
        light.target.position.set(...s.target);
      }
      if (beam) {
        // Run the beam down to the floor (or to the target if aimed upward).
        const direction = new Vector3(...s.target).normalize();
        object.node.getWorldPosition(origin);
        const toFloor = direction.y < -0.05 ? origin.y / -direction.y : Infinity;
        const length = Math.min(toFloor, new Vector3(...s.target).length() * 1.5, 30);
        const opacity = 0.1 * s.beam * world.haze * level * s.scale;
        beam.set(direction, length, MathUtils.degToRad(s.angle) * 0.9, s.color, opacity);
      }
    };
    apply();
    return {
      update(dt) {
        const target = levelNow();
        if (level !== target) {
          const step = s.fade > 0 ? dt / s.fade : 1;
          level = target > level ? Math.min(target, level + step) : Math.max(target, level - step);
        }
        apply();
      },
      dispose() {
        map?.dispose();
        beam?.dispose();
        if (light instanceof SpotLight || light instanceof DirectionalLight) {
          light.target.removeFromParent();
        }
        light.removeFromParent();
        light.dispose();
      },
    };
  },
});
