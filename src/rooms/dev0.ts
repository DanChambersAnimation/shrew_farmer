import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { STAGE, churchHall } from "../locations/church-hall.ts";
import { fillSeats } from "../prefabs/audience-member.ts";
import { speaker } from "../prefabs/speaker.ts";
import { CameraView } from "../traits/camera-view.ts";

rooms.register({
  name: "dev0",
  title: "Church hall",
  tags: ["dev"],
  build(room) {
    room.add(CameraView, {
      // Behind and above the speaker, looking down at the audience (set with noclip),
      // with a slow side-to-side sway.
      position: [0.02, 4.61, 5.28],
      lookAt: [0.02, 0.29, -3.74],
      fov: 50,
      swayDegrees: 5,
      swayPeriod: 22,
    });
    fillSeats(spawnSpec(room, churchHall()));
    // The player, on stage with his back to us, facing the audience.
    spawnSpec(room, speaker([-2.6, STAGE.height, 2.2]));
  },
});
