import { describe, expect, it } from "vite-plus/test";
import { spin } from "./spin.ts";

describe("spin", () => {
  it("advances by speed * dt", () => {
    expect(spin(0, 0.5, 2)).toBeCloseTo(1);
  });

  it("wraps past a full turn", () => {
    expect(spin(Math.PI * 2 - 0.1, 1, 0.2)).toBeCloseTo(0.1);
  });

  it("wraps negative speeds into range", () => {
    expect(spin(0, 1, -0.5)).toBeCloseTo(Math.PI * 2 - 0.5);
  });
});
