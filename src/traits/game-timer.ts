import { defineTrait } from "../core/trait.ts";

/** Emitted by the room once when its round clock reaches the end. */
export const GAME_TIMER_FINISHED = "game-timer-finished";

/** A room-owned round clock. The screen meter reads these live settings. */
export const GameTimer = defineTrait({
  name: "game-timer",
  defaults: {
    durationSeconds: 60,
    elapsedSeconds: 0,
    running: true,
  },
  setup({ settings }) {
    if (!Number.isFinite(settings.durationSeconds) || settings.durationSeconds <= 0) {
      throw new Error("GameTimer durationSeconds must be positive");
    }
    settings.elapsedSeconds = Math.max(
      0,
      Math.min(settings.durationSeconds, settings.elapsedSeconds),
    );
    if (settings.elapsedSeconds === settings.durationSeconds) settings.running = false;
  },
  update({ object, settings }, dt) {
    if (!settings.running || dt <= 0) return;
    settings.elapsedSeconds = Math.min(settings.durationSeconds, settings.elapsedSeconds + dt);
    if (settings.elapsedSeconds === settings.durationSeconds) {
      settings.running = false;
      object.emit(GAME_TIMER_FINISHED);
    }
  },
});
