import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { HALL, churchHall } from "../locations/church-hall.ts";
import { audienceMember } from "../prefabs/audience-member.ts";
import { CameraView } from "../traits/camera-view.ts";
import { Seat } from "../traits/seat.ts";

rooms.register({
  name: "dev0",
  title: "Church hall",
  tags: ["dev"],
  build(room) {
    room.add(CameraView, {
      // Behind the speaker, well above standing eye height, tilted down toward
      // the seated audience at the far end of the hall.
      position: [0, 3.4, HALL.depth / 2 - 1],
      lookAt: [0, 0.6, -HALL.depth / 2],
      fov: 50,
    });
    const hall = spawnSpec(room, churchHall());

    // Fill every seat in the hall.
    let seed = 1;
    for (const seat of [...hall.descendants()].filter((o) => o.has(Seat))) {
      spawnSpec(seat, audienceMember(seed++, seat.settingsOf(Seat)!.sitPoint));
    }
  },
});
