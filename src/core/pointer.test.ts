import { MeshStandardMaterial, type Mesh } from "three";
import { describe, expect, it } from "vite-plus/test";
import { Highlight } from "../traits/highlight.ts";
import { INSPECT, Inspectable, type InspectInfo } from "../traits/inspectable.ts";
import { Shape } from "../traits/shape.ts";
import { Transform } from "../traits/transform.ts";
import { POINTER } from "./pointer.ts";
import { trait } from "./trait.ts";
import { World } from "./world.ts";

const CENTER = { x: 0, y: 0 };
const CORNER = { x: 0.99, y: 0.99 };

/** Camera at z=5 looking at a unit box ("target") at the origin, inside a "group". */
function scene() {
  const world = new World();
  world.camera.position.set(0, 0, 5);
  world.camera.lookAt(0, 0, 0);
  const root = world.createRoot("root");
  const group = root.spawn("group");
  const box = group.spawn("box", [trait(Shape)]);
  const log: string[] = [];
  for (const obj of [root, group, box]) {
    for (const type of Object.values(POINTER)) obj.on(type, () => log.push(`${type} ${obj.kind}`));
  }
  return { world, root, group, box, log };
}

describe("PointerSystem", () => {
  it("enters outermost-first and leaves innermost-first", () => {
    const { world, log } = scene();
    world.pointer.move(CENTER);
    world.pointer.move(CENTER);
    world.pointer.move(CORNER);
    expect(log).toEqual([
      "pointer:enter root",
      "pointer:enter group",
      "pointer:enter box",
      "pointer:leave box",
      "pointer:leave group",
      "pointer:leave root",
    ]);
  });

  it("bubbles clicks from the target to the root", () => {
    const { world, box, log } = scene();
    world.pointer.move(CENTER);
    log.length = 0;
    world.pointer.click();
    expect(log).toEqual(["pointer:click box", "pointer:click group", "pointer:click root"]);
    expect(world.pointer.target).toBe(box);
  });

  it("does nothing when clicking empty space", () => {
    const { world, log } = scene();
    world.pointer.move(CORNER);
    world.pointer.click();
    expect(log).toEqual([]);
  });

  it("lets the nearest surface block objects behind it", () => {
    const { world, root, log } = scene();
    root.spawn("screen", [trait(Transform, { position: [0, 0, 2] }), trait(Shape)]);
    world.pointer.move(CENTER);
    expect(world.pointer.target?.kind).toBe("screen");
    expect(log).toEqual(["pointer:enter root"]);
  });

  it("reports interactive only when something under the pointer listens", () => {
    const world = new World();
    world.camera.position.set(0, 0, 5);
    world.camera.lookAt(0, 0, 0);
    const box = world.createRoot("root").spawn("box", [trait(Shape)]);
    world.pointer.move(CENTER);
    expect(world.pointer.interactive).toBe(false);
    box.add(Highlight);
    expect(world.pointer.interactive).toBe(true);
  });
});

describe("pointer traits", () => {
  it("Inspectable shows the innermost hovered info and hides on leave", () => {
    const { world, group, box } = scene();
    group.add(Inspectable, { title: "Group" });
    box.add(Inspectable, { title: "Box" });
    const shown: (string | null)[] = [];
    world.events.on(INSPECT, (p) => shown.push((p as InspectInfo | null)?.title ?? null));
    world.pointer.move(CENTER);
    world.pointer.move(CORNER);
    expect(shown).toEqual(["Group", "Box", "Group", null]);
  });

  it("Highlight glows while hovered and restores afterwards", () => {
    const { world, box } = scene();
    box.add(Highlight, { color: 0xff0000, intensity: 0.5 });
    const material = (box.node.children[0] as Mesh).material as MeshStandardMaterial;
    world.pointer.move(CENTER);
    expect(material.emissive.getHex()).toBe(0xff0000);
    expect(material.emissiveIntensity).toBe(0.5);
    world.pointer.move(CORNER);
    expect(material.emissive.getHex()).toBe(0x000000);
    expect(material.emissiveIntensity).toBe(1);
  });
});
