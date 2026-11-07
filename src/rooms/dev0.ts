import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { STAGE, churchHall } from "../locations/church-hall.ts";
import { fillSeats } from "../prefabs/audience-member.ts";
import { speaker } from "../prefabs/speaker.ts";
import { CameraView } from "../traits/camera-view.ts";
import { LookAround } from "../traits/look-around.ts";

rooms.register({
  name: "dev0",
  title: "Church hall",
  tags: ["dev"],
  build(room) {
    room.add(CameraView, {
      // Behind and above the speaker, looking down at the audience (set with noclip),
      // with a slow side-to-side sway.
      position: [0.68, 5.96, 5.25],
      lookAt: [0.69, -0.07, -2.73],
      fov: 50,
      swayDegrees: 5,
      swayPeriod: 22,
    });
    fillSeats(spawnSpec(room, churchHall()));
    // The player, centre stage with his back to us, facing the audience and
    // turning from the waist to look around the room.
    spawnSpec(room, speaker([0, STAGE.height, 2.2])).add(LookAround, { degrees: 55, period: 4 });
  },
});
