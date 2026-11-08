import {
  BackSide,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";
import { defineTrait } from "../core/trait.ts";

/**
 * Turns the world's day/night setting (world.outside) into light levels: the
 * "daylight" group is up by day, the "streetlight" group by night. Lights and
 * glows in those groups fade with it like any lighting cue.
 */
export const DayNight = defineTrait({
  name: "day-night",
  defaults: { daylight: "daylight", streetlight: "streetlight" },
  setup({ world, settings: s }) {
    return {
      update() {
        const night = world.outside === "night";
        world.lightLevels.set(s.daylight, night ? 0 : 1);
        world.lightLevels.set(s.streetlight, night ? 1 : 0);
      },
    };
  },
});

/** A backdrop dome of sky around the scene, coloured for day or night. */
export const Sky = defineTrait({
  name: "sky",
  defaults: { day: 0xa9cdee, night: 0x070a14, radius: 80 },
  setup({ object, world, settings: s }) {
    const material = new MeshBasicMaterial({ side: BackSide, fog: false });
    const dome = new Mesh(new SphereGeometry(s.radius, 32, 16), material);
    dome.raycast = () => {};
    object.node.add(dome);
    return {
      update() {
        material.color = new Color(world.outside === "night" ? s.night : s.day);
      },
      dispose() {
        dome.removeFromParent();
        dome.geometry.dispose();
        material.dispose();
      },
    };
  },
});

/**
 * Makes the object's glowing surfaces (e.g. a lamp's bulb) follow a light
 * group, so they switch on and off with the lights: glow = `intensity` x level.
 */
export const GroupGlow = defineTrait({
  name: "group-glow",
  defaults: { group: "", intensity: 1 },
  setup({ object, world, settings: s }) {
    const materials: MeshStandardMaterial[] = [];
    object.node.traverse((node) => {
      if (node instanceof Mesh && node.material instanceof MeshStandardMaterial) {
        materials.push(node.material);
      }
    });
    return {
      update() {
        const level = world.lightLevels.get(s.group) ?? 1;
        for (const m of materials) m.emissiveIntensity = s.intensity * level;
      },
    };
  },
});
