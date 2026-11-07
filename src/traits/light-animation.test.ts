import { PointLight, SpotLight } from "three";
import { describe, expect, it } from "vite-plus/test";
import { trait } from "../core/trait.ts";
import { World } from "../core/world.ts";
import { ColorCycle, Pulse, Sweep } from "./light-animation.ts";
import { Light } from "./light.ts";

/**
 * Advance `dt`, then a zero-length frame: animation traits update after the
 * Light they drive, so the light shows their change on the following frame.
 */
const step = (obj: { update(dt: number): void }, dt: number) => {
  obj.update(dt);
  obj.update(0);
};

const lightIn = <T>(obj: { node: { children: unknown[] } }, type: new (...a: never[]) => T) =>
  obj.node.children.find((c) => c instanceof type) as T;

describe("light animation traits", () => {
  it("Pulse square flashes on and off", () => {
    const obj = new World()
      .createRoot("room")
      .spawn("strobe", [
        trait(Light, { kind: "point", intensity: 10 }),
        trait(Pulse, { wave: "square", rate: 2 }),
      ]);
    const light = lightIn(obj, PointLight);
    step(obj, 0.1); // first half of a 0.5 s cycle: on
    expect(light.intensity).toBeCloseTo(10);
    step(obj, 0.25); // 0.35 s: second half, off
    expect(light.intensity).toBeCloseTo(0);
    obj.remove(Pulse);
    step(obj, 0);
    expect(light.intensity).toBeCloseTo(10);
  });

  it("Sweep moves the aim back and forth around the starting target", () => {
    const obj = new World()
      .createRoot("room")
      .spawn("spot", [
        trait(Light, { kind: "spot", target: [0, -5, 0] }),
        trait(Sweep, { amplitude: [2, 0, 0], period: 4 }),
      ]);
    const light = lightIn(obj, SpotLight);
    step(obj, 1); // a quarter period: full swing
    expect(light.target.position.x).toBeCloseTo(2);
    expect(light.target.position.y).toBeCloseTo(-5);
    step(obj, 2); // three quarters: the other way
    expect(light.target.position.x).toBeCloseTo(-2);
  });

  it("ColorCycle steps through colours, offset by phase", () => {
    const make = (phase: number) =>
      new World()
        .createRoot("room")
        .spawn("chase", [
          trait(Light, { kind: "point" }),
          trait(ColorCycle, { colors: [0xff0000, 0x00ff00, 0x0000ff], period: 1, phase }),
        ]);
    const a = make(0);
    const b = make(1);
    step(a, 0.5);
    step(b, 0.5);
    expect(lightIn(a, PointLight).color.getHex()).toBe(0xff0000);
    expect(lightIn(b, PointLight).color.getHex()).toBe(0x00ff00);
    step(a, 1);
    expect(lightIn(a, PointLight).color.getHex()).toBe(0x00ff00);
  });

  it("each needs a Light", () => {
    const obj = new World().createRoot("room");
    expect(() => obj.add(Pulse)).toThrow(/needs Light/);
  });
});
