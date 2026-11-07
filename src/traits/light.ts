import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  type Light as ThreeLight,
  MathUtils,
  PointLight,
  SpotLight,
} from "three";
import { defineTrait } from "../core/trait.ts";
import type { Vec3 } from "./types.ts";

export type LightKind = "ambient" | "hemisphere" | "directional" | "point" | "spot";

/**
 * Emits light from the object's origin. `target` is in the object's local space
 * and applies to directional and spot lights.
 *
 * A light in a `group` (e.g. "house") is scaled by the world's level for that
 * group (see LightingCues), fading over `fade` seconds when the level changes.
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
    if (
      s.castShadow &&
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
    light.intensity = s.intensity * level;
    return {
      update(dt) {
        const target = levelNow();
        if (level === target) return;
        const step = s.fade > 0 ? dt / s.fade : 1;
        level = target > level ? Math.min(target, level + step) : Math.max(target, level - step);
        light.intensity = s.intensity * level;
      },
      dispose() {
        if (light instanceof SpotLight || light instanceof DirectionalLight) {
          light.target.removeFromParent();
        }
        light.removeFromParent();
        light.dispose();
      },
    };
  },
});
