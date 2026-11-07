import { MathUtils, Vector3 } from "three";
import { defineTrait } from "../core/trait.ts";
import { Beam } from "../render/beam.ts";
import type { Vec3 } from "./types.ts";

/**
 * A laser unit: a fan of `beams` thin, bright beams from the object's origin,
 * spread `spread` degrees side to side around `aim` (a direction, local space),
 * sweeping up and down by `sweep` degrees every `period` seconds. In a light
 * `group`, so lighting cues switch it on and off; brighter with haze, but
 * always faintly visible (lasers are bright enough to see in clean air).
 */
export const Laser = defineTrait({
  name: "laser",
  defaults: {
    color: 0x33ff66,
    beams: 7,
    spread: 50,
    aim: [0, 0.2, -1] as Vec3,
    sweep: 12,
    period: 3,
    length: 18,
    /** Beam radius, metres. */
    width: 0.006,
    group: "",
  },
  setup({ object, world, settings: s }) {
    const rays = Array.from({ length: s.beams }, () => new Beam("ray"));
    for (const ray of rays) object.node.add(ray.mesh);
    const up = new Vector3(0, 1, 0);
    let t = 0;
    return {
      update(dt) {
        t += dt;
        const level = s.group ? (world.lightLevels.get(s.group) ?? 1) : 1;
        const opacity = level * (0.55 + 0.45 * Math.min(1, world.haze));
        const aim = new Vector3(...s.aim).normalize();
        const side = new Vector3().crossVectors(aim, up).normalize();
        const tilt = MathUtils.degToRad(s.sweep) * Math.sin((2 * Math.PI * t) / s.period);
        rays.forEach((ray, i) => {
          const fan = rays.length > 1 ? i / (rays.length - 1) - 0.5 : 0;
          const direction = aim
            .clone()
            .applyAxisAngle(up, MathUtils.degToRad(s.spread) * fan)
            .applyAxisAngle(side, tilt);
          ray.set(direction, s.length, s.width, s.color, opacity);
        });
      },
      dispose() {
        for (const ray of rays) ray.dispose();
      },
    };
  },
});
