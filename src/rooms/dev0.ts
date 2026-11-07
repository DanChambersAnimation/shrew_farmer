import { rooms } from "../core/room-registry.ts";
import { churchHallShow } from "../scenes/church-hall-show.ts";

rooms.register({
  name: "dev0",
  title: "Church hall",
  tags: ["dev"],
  build(room) {
    churchHallShow(room);
  },
});
