import { rooms } from "../core/room-registry.ts";
import { churchHallShow } from "../scenes/church-hall-show.ts";
import { BubbleDirector } from "../traits/bubble-director.ts";
import { MoodStirrer } from "../traits/mood-stirrer.ts";

/**
 * Speech bubbles: audience members show how they feel when their mood
 * changes, at most two bubbles at a time. A stirrer shifts a random person's
 * mood every second or so, so there's always something to see.
 */
rooms.register({
  name: "dev9",
  title: "Speech bubbles",
  tags: ["dev"],
  build(room) {
    churchHallShow(room);
    room.add(BubbleDirector);
    room.add(MoodStirrer, { every: 1.2 });
  },
});
