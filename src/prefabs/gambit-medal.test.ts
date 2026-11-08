import { describe, expect, it } from "vite-plus/test";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { items } from "../gambits/library.ts";
import { createGambitMedal, medalJiggle } from "./gambit-medal.ts";
import { createMaterialise } from "../hud/materialise.ts";
import { ruleOfThree } from "../gambits/items/rhetoric.ts";

describe("gambit medals", () => {
  it("lights one Rule of Three mark per accepted use", () => {
    const medal = createGambitMedal(ruleOfThree.medal);
    const lit = () =>
      medal.group.children.filter(
        (child) =>
          child instanceof Mesh &&
          child.material instanceof MeshBasicMaterial &&
          child.material.color.getHex() === 0xff7187,
      ).length;
    expect(lit()).toBe(0);
    medal.setStage(1);
    expect(lit()).toBe(2);
    medal.setStage(2);
    expect(lit()).toBe(4);
    medal.setStage(3);
    expect(lit()).toBe(6);
    medal.dispose();
  });

  it("materialises an incoming medal before restoring its own material", () => {
    const medal = createGambitMedal(ruleOfThree.medal);
    const body = medal.group.children[0] as Mesh;
    const original = body.material;
    const effect = createMaterialise(medal.group, { seconds: 0.5 });
    expect(body.material).not.toBe(original);
    expect(effect.update(0.25)).toBe(true);
    expect(effect.update(0.25)).toBe(false);
    expect(body.material).toBe(original);
    expect(medal.group.visible).toBe(true);
    medal.dispose();
  });

  it("builds a distinct 3D emblem for every registered gambit", () => {
    for (const id of items.names()) {
      const item = items.get(id);
      const medal = createGambitMedal(item.medal);
      const meshes = medal.group.children.filter((child) => child instanceof Mesh);
      expect(meshes.length).toBeGreaterThan(3);
      expect(meshes[0]?.geometry.type).toBe(
        item.medal.shape === "round" ? "CylinderGeometry" : "BoxGeometry",
      );
      medal.dispose();
    }
  });

  it("jiggles gently and out of step between gambits", () => {
    const first = medalJiggle(0.6, 0);
    const second = medalJiggle(0.6, 2);
    expect(first).not.toEqual(second);
    for (let frame = 0; frame < 300; frame++) {
      const motion = medalJiggle(frame / 60, 0.8);
      expect(Math.abs(motion.x)).toBeLessThanOrEqual(0.08);
      expect(Math.abs(motion.y)).toBeLessThanOrEqual(0.11);
      expect(Math.abs(motion.z)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(motion.bob)).toBeLessThanOrEqual(1.5);
    }
  });

  it("boils a spent medal away and restores its own material before disposal", () => {
    const geometry = new BoxGeometry(1, 1, 0.2);
    const material = new MeshStandardMaterial({ color: 0xffc857 });
    const mesh = new Mesh(geometry, material);
    const medal = new Group();
    medal.add(mesh);
    const effect = createMaterialise(medal, { seconds: 0.8, out: true });
    expect(mesh.material).not.toBe(material);
    expect(effect.update(0.4)).toBe(true);
    expect(medal.visible).toBe(true);
    expect(effect.update(0.4)).toBe(false);
    expect(medal.visible).toBe(false);
    expect(mesh.material).toBe(material);
    geometry.dispose();
    material.dispose();
  });
});
