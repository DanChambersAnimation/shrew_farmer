import { Box3, Mesh } from "three";
import { describe, expect, it } from "vite-plus/test";
import { seatedProfile } from "../characters/audience.ts";
import { figureGeometry } from "./paper-figure.ts";

const bounds = (geometry: ReturnType<typeof figureGeometry>) =>
  new Box3().setFromObject(new Mesh(geometry));

describe("figureGeometry", () => {
  it("is a flat panel with the anchor at the origin by default", () => {
    const box = bounds(figureGeometry(100, 200, 0.01, [50, 150]));
    expect(box.min.toArray()).toEqual([-0.5, -0.5, 0]);
    expect(box.max.toArray()).toEqual([0.5, 1.5, 0]);
  });

  it("bends along a profile: one quad per segment", () => {
    const geometry = figureGeometry(
      100,
      200,
      0.01,
      [50, 100],
      [
        [0, 1, 0],
        [100, 0, 0],
        [200, 0, 0.5],
      ],
    );
    expect(geometry.getAttribute("position").count).toBe(12);
    const box = bounds(geometry);
    expect(box.max.z).toBeCloseTo(0.5);
    expect(box.min.y).toBeCloseTo(0);
  });

  it("seats a figure: thighs forward, feet on the floor, head clear of the chair back", () => {
    const profile = seatedProfile(0.004, 0.41);
    const [head, neck, hips, knees, feet] = profile;
    expect(hips!.slice(1)).toEqual([0, 0]);
    expect(knees![1]).toBe(0);
    expect(knees![2]).toBeGreaterThan(0.2);
    expect(feet![1]).toBeCloseTo(-0.41);
    expect(head![1]).toBeGreaterThan(neck![1]);
    expect(head![2]).toBeLessThan(0); // tipped back toward the camera above
  });
});
