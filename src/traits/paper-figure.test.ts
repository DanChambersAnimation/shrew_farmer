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

  it("bends along a profile, with a separate smooth strip between folds", () => {
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
    // Two strips (split at the fold at row 100), each 2 rows x 9 columns.
    expect(geometry.getAttribute("position").count).toBe(36);
    const box = bounds(geometry);
    expect(box.max.z).toBeCloseTo(0.5);
    expect(box.min.y).toBeCloseTo(0);
  });

  it("seats a figure: thighs forward, feet on the floor, upright torso and head", () => {
    const profile = seatedProfile(0.004, 0.41);
    const [head, neck, hips, knees, feet] = profile;
    expect(hips!.slice(1)).toEqual([0, 0]);
    expect(knees![1]).toBe(0);
    expect(knees![2]).toBeGreaterThan(0.2);
    expect(feet![1]).toBeCloseTo(-0.41);
    expect(head![1]).toBeGreaterThan(neck![1]);
    expect(head![2]).toBeCloseTo(0); // perpendicular to the floor
    expect(seatedProfile(0.004, 0.41, 0.34, 20)[0]![2]).toBeLessThan(0); // optional tilt back
  });
});

describe("figure twist", () => {
  // 100 x 200 rig, 1 unit = 0.01 m, anchor at the bottom centre: rows 0..200 → y 2..0.
  const twisted = (degrees: number) =>
    figureGeometry(100, 200, 0.01, [50, 200], [], {
      degrees,
      curve: [
        [150, 0],
        [50, 1],
      ],
    });
  const zRange = (geometry: ReturnType<typeof figureGeometry>, minY: number, maxY: number) => {
    const pos = geometry.getAttribute("position");
    const zs: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y >= minY - 1e-6 && y <= maxY + 1e-6) zs.push(pos.getZ(i));
    }
    return Math.max(...zs) - Math.min(...zs);
  };

  it("leaves the legs flat and turns the upper body", () => {
    const geometry = twisted(90);
    expect(zRange(geometry, 0, 0.5)).toBeCloseTo(0); // below the waist: untouched
    expect(zRange(geometry, 1.5, 2)).toBeCloseTo(1); // above the shoulders: edge-on, 1 m deep
  });

  it("is a flat panel with no twist", () => {
    expect(zRange(twisted(0), 0, 2)).toBeCloseTo(0);
  });
});

describe("turning the head", () => {
  it("keeps everything above the last curve point flat (a rigid card)", () => {
    // Rows 0..60 are the "head": fully turned 40°, so every vertex there has z = -x·sin40°.
    const geometry = figureGeometry(100, 200, 0.01, [50, 200], [], {
      degrees: 40,
      curve: [
        [150, 0],
        [100, 0.5],
        [60, 1],
      ],
    });
    const pos = geometry.getAttribute("position");
    const sin = Math.sin((40 * Math.PI) / 180);
    const cos = Math.cos((40 * Math.PI) / 180);
    let checked = 0;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < 2 - 0.6 + 1e-6) continue; // rows below 60 are lower than y = 1.4
      const x = pos.getX(i) / cos; // un-turned x
      expect(pos.getZ(i)).toBeCloseTo(-x * sin);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("lean", () => {
  // 100 x 200 rig, anchor at the bottom centre: rows 0..200 → y 2..0. Lean above row 100 (y = 1).
  const leaned = (degrees: number) =>
    figureGeometry(100, 200, 0.01, [50, 200], [], undefined, { degrees, from: 100 });

  it("tips the part above the pivot row back, leaving the rest upright", () => {
    const pos = leaned(90).getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < 1 - 1e-6) expect(pos.getZ(i)).toBeCloseTo(0); // below the neck
    }
    const box = new Box3().setFromBufferAttribute(pos as never);
    expect(box.max.y).toBeCloseTo(1); // the top now points straight back, at neck height
    expect(box.min.z).toBeCloseTo(-1);
  });
});
