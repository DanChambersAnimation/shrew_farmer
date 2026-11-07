import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { GAME_TIMER_FINISHED, GameTimer } from "./game-timer.ts";

describe("GameTimer", () => {
  it("runs a one-minute round and finishes only once", () => {
    const world = new World();
    const room = world.createRoot("room").add(GameTimer);
    const clock = room.settingsOf(GameTimer)!;
    let finishes = 0;
    room.on(GAME_TIMER_FINISHED, () => finishes++);

    world.update(30);
    expect(clock.elapsedSeconds).toBe(30);
    expect(clock.running).toBe(true);
    world.update(30);
    expect(clock.elapsedSeconds).toBe(60);
    expect(clock.running).toBe(false);
    expect(finishes).toBe(1);
    world.update(30);
    expect(clock.elapsedSeconds).toBe(60);
    expect(finishes).toBe(1);
  });

  it("can be paused and restarted through its live settings", () => {
    const world = new World();
    const clock = world.createRoot("room").add(GameTimer).settingsOf(GameTimer)!;
    clock.running = false;
    world.update(10);
    expect(clock.elapsedSeconds).toBe(0);
    clock.running = true;
    world.update(10);
    expect(clock.elapsedSeconds).toBe(10);
  });
});
