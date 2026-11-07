import type { GameObject } from "../core/game-object.ts";
import { spawnSpec } from "../core/spec.ts";
import { STAGE, churchHall } from "../locations/church-hall.ts";
import { fillSeats } from "../prefabs/audience-member.ts";
import { speaker } from "../prefabs/speaker.ts";
import { Bloom } from "../traits/bloom.ts";
import { CameraView } from "../traits/camera-view.ts";
import { LookAround } from "../traits/look-around.ts";
import type { Vec3 } from "../traits/types.ts";

/**
 * The basic show in the church hall, shared by rooms that build on it: the hall
 * with every seat filled, the Speaker centre stage looking around, and the
 * camera behind and above him. Returns where the Speaker stands.
 */
export function churchHallShow(room: GameObject): { speakerAt: Vec3; speaker: GameObject } {
  room.add(CameraView, {
    // Behind and above the speaker, looking down at the audience (set with noclip),
    // with a slow side-to-side sway.
    position: [0.68, 5.96, 5.25],
    lookAt: [0.69, -0.07, -2.73],
    fov: 50,
    swayDegrees: 5,
    swayPeriod: 22,
  });
  // Bright things (the windows, stage effects) glow.
  room.add(Bloom);
  fillSeats(spawnSpec(room, churchHall()));
  // The player, centre stage with his back to us, facing the audience and
  // glancing from side to side every 4 seconds.
  const speakerAt: Vec3 = [0, STAGE.height, 2.2];
  const pc = spawnSpec(room, speaker(speakerAt)).add(LookAround, {
    degrees: 55,
    period: 4,
    motion: "glance",
    turn: 0.8,
  });
  return { speakerAt, speaker: pc };
}
