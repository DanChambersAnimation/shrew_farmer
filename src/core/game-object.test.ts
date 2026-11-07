import { describe, expect, it } from "vite-plus/test";
import { spawnSpec } from "./spec.ts";
import { defineTrait, trait } from "./trait.ts";
import { World } from "./world.ts";

function makeLog() {
  const log: string[] = [];
  const Tracked = defineTrait({
    name: "tracked",
    defaults: { id: "?", speed: 1 },
    setup({ settings }) {
      log.push(`setup ${settings.id}`);
      return () => log.push(`cleanup ${settings.id}`);
    },
    update({ settings }, dt) {
      log.push(`update ${settings.id} ${dt * settings.speed}`);
    },
  });
  return { log, Tracked };
}

describe("GameObject", () => {
  it("merges settings over defaults without sharing default objects", () => {
    const Tagged = defineTrait({ name: "tagged", defaults: { tags: ["a"], n: 1 } });
    const world = new World();
    const root = world.createRoot("root");
    const a = root.spawn("a", [trait(Tagged, { n: 2 })]);
    const b = root.spawn("b", [trait(Tagged)]);
    a.settingsOf(Tagged)!.tags.push("x");
    expect(a.settingsOf(Tagged)).toEqual({ tags: ["a", "x"], n: 2 });
    expect(b.settingsOf(Tagged)).toEqual({ tags: ["a"], n: 1 });
  });

  it("runs setup on add and cleanup on remove, and supports runtime changes", () => {
    const { log, Tracked } = makeLog();
    const obj = new World().createRoot("root");
    obj.add(Tracked, { id: "t" });
    expect(obj.has(Tracked)).toBe(true);
    obj.remove(Tracked);
    expect(obj.has(Tracked)).toBe(false);
    expect(log).toEqual(["setup t", "cleanup t"]);
  });

  it("supports per-attachment instances with update and dispose", () => {
    const log: string[] = [];
    const Counter = defineTrait({
      name: "counter",
      defaults: { id: "" },
      setup({ settings }) {
        let ticks = 0;
        return {
          update: () => void log.push(`${settings.id} ${++ticks}`),
          dispose: () => void log.push(`${settings.id} done`),
        };
      },
    });
    const root = new World().createRoot("root");
    root.spawn("a", [trait(Counter, { id: "a" })]);
    root.spawn("b", [trait(Counter, { id: "b" })]);
    root.update(1);
    root.update(1);
    root.dispose();
    expect(log).toEqual(["a 1", "b 1", "a 2", "b 2", "b done", "a done"]);
  });

  it("rejects attaching the same trait twice", () => {
    const { Tracked } = makeLog();
    const obj = new World().createRoot("root").add(Tracked);
    expect(() => obj.add(Tracked)).toThrow(/already attached/);
  });

  it("updates its own traits, then children, in order", () => {
    const { log, Tracked } = makeLog();
    const root = new World().createRoot("root").add(Tracked, { id: "root" });
    root.spawn("child", [trait(Tracked, { id: "child", speed: 2 })]);
    log.length = 0;
    root.update(0.5);
    expect(log).toEqual(["update root 0.5", "update child 1"]);
  });

  it("disposes children first and traits in reverse order", () => {
    const { log } = makeLog();
    const First = defineTrait({
      name: "first",
      defaults: {},
      setup: () => () => log.push("first"),
    });
    const Second = defineTrait({
      name: "second",
      defaults: {},
      setup: () => () => log.push("second"),
    });
    const root = new World().createRoot("root").add(First).add(Second);
    const child = root.spawn("child", [trait(First)]);
    root.dispose();
    expect(log).toEqual(["first", "second", "first"]);
    expect(root.children).toEqual([]);
    expect(child.node.parent).toBeNull();
  });

  it("delivers events to subscribers until they unsubscribe", () => {
    const obj = new World().createRoot("root");
    const seen: unknown[] = [];
    const off = obj.on("cheer", (p) => seen.push(p));
    obj.emit("cheer", 1);
    off();
    obj.emit("cheer", 2);
    expect(seen).toEqual([1]);
  });
});

describe("spawnSpec", () => {
  it("builds nested objects with traits", () => {
    const { log, Tracked } = makeLog();
    const root = new World().createRoot("root");
    const hall = spawnSpec(root, {
      kind: "hall",
      traits: [trait(Tracked, { id: "hall" })],
      children: [{ kind: "chair" }, { kind: "chair", traits: [trait(Tracked, { id: "c" })] }],
    });
    expect(hall.children.map((c) => c.kind)).toEqual(["chair", "chair"]);
    expect(hall.node.children).toHaveLength(2);
    expect(log).toEqual(["setup hall", "setup c"]);
  });
});
