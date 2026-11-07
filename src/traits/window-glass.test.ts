import { Mesh, MeshStandardMaterial } from "three";
import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { Shape } from "./shape.ts";
import { WindowGlass } from "./window-glass.ts";

describe("WindowGlass", () => {
  it("follows the world's day/night setting", () => {
    const world = new World();
    const glass = world
      .createRoot("room")
      .spawn("glass", [trait(Shape), trait(WindowGlass, { dayGlow: 1.1, nightGlow: 0.9 })]);
    const material = (glass.node.children[0] as Mesh).material as MeshStandardMaterial;
    expect(material.emissiveIntensity).toBeCloseTo(1.1);
    world.outside = "night";
    glass.update(0);
    expect(material.emissiveIntensity).toBeCloseTo(0.9);
    expect(material.color.getHex()).toBeLessThan(0x202020); // dark glass at night
  });
});
