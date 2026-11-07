import { describe, expect, it } from "vite-plus/test";
import { RoomRegistry } from "./room-registry.ts";
import { defineTrait } from "./trait.ts";
import { World } from "./world.ts";

describe("RoomRegistry", () => {
  it("rejects duplicate names and unknown rooms", () => {
    const registry = new RoomRegistry();
    registry.register({ name: "dev0", build() {} });
    expect(() => registry.register({ name: "dev0", build() {} })).toThrow(/already registered/);
    expect(() => registry.load(new World(), "nope")).toThrow(/Unknown room/);
  });

  it("disposes the previous room before building the next", () => {
    const log: string[] = [];
    const Marker = defineTrait({
      name: "marker",
      defaults: { room: "" },
      setup({ settings }) {
        log.push(`build ${settings.room}`);
        return () => log.push(`dispose ${settings.room}`);
      },
    });
    const registry = new RoomRegistry();
    for (const name of ["auditorium", "green-room"]) {
      registry.register({ name, build: (room) => void room.add(Marker, { room: name }) });
    }
    const world = new World();
    registry.load(world, "auditorium");
    const room = registry.load(world, "green-room");
    expect(log).toEqual(["build auditorium", "dispose auditorium", "build green-room"]);
    expect(world.current).toBe(room);
    expect(world.scene.children).toEqual([room.node]);
  });
});
