import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import "./builtin.ts";
import { effects, runEffect, runEffects, type EffectContext, type EffectDef } from "./library.ts";

function context(verdict: EffectContext["verdict"] = "success"): EffectContext {
  const world = new World();
  return { world, room: world.createRoot("room"), moveId: "test", verdict, atSeconds: 12 };
}

describe("effects registry", () => {
  it("registers the built-in effects with their kinds", () => {
    expect(effects.names()).toEqual(
      expect.arrayContaining([
        "house-lift",
        "house-dip",
        "applause",
        "awkward-silence",
        "rule-of-three-tone",
      ]),
    );
    expect(effects.get("house-lift").kind).toBe("lighting");
    expect(effects.get("applause").kind).toBe("audio");
  });

  it("fades light groups when a lighting effect runs", () => {
    const ctx = context();
    runEffect({ id: "house-dip" }, ctx);
    expect(ctx.world.lightLevels.get("house")).toBe(0.35);
    runEffect({ id: "house-lift" }, ctx);
    expect(ctx.world.lightLevels.get("house")).toBe(1);
  });

  it("runs a list of effects in order", () => {
    const order: string[] = [];
    const record = (id: string): EffectDef => ({
      id,
      kind: "visual",
      run: () => order.push(id),
    });
    effects.register("first", record("first"));
    effects.register("second", record("second"));
    runEffects([{ id: "first" }, { id: "second" }], context());
    expect(order).toEqual(["first", "second"]);
  });

  it("only plays the effect that matches the verdict", () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (message: string) => lines.push(message);
    try {
      runEffect({ id: "applause" }, context("success"));
      runEffect({ id: "awkward-silence" }, context("success"));
      runEffect({ id: "applause" }, context("failure"));
      runEffect({ id: "awkward-silence" }, context("failure"));
    } finally {
      console.info = original;
    }
    expect(lines).toEqual(["[effect] applause", "[effect] awkward silence"]);
  });

  it("refuses an effect that was never registered", () => {
    expect(() => runEffect({ id: "nope" }, context())).toThrow('Unknown effect "nope"');
  });
});
