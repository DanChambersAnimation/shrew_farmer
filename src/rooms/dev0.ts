import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { HALL, churchHall } from "../locations/church-hall.ts";
import { CameraView } from "../traits/camera-view.ts";

rooms.register({
  name: "dev0",
  title: "Church hall",
  tags: ["dev"],
  build(room) {
    room.add(CameraView, {
      position: [0, 1.7, HALL.depth / 2 - 1],
      lookAt: [0, HALL.height * 0.45, -HALL.depth / 2],
      fov: 55,
    });
    spawnSpec(room, churchHall());
  },
});
