import { rooms } from "../core/room-registry.ts";
import { churchHallShow } from "../scenes/church-hall-show.ts";
import { CrowdSimulation } from "../traits/crowd-simulation.ts";
import { GambitSelection } from "../traits/gambit-selection.ts";
import { Gambits } from "../traits/gambits.ts";
import { GameTimer } from "../traits/game-timer.ts";

/** Every medal in a fixed rack, for checking its shape, emblem and motion. */
rooms.register({
  name: "dev8",
  title: "Gambit medals",
  tags: ["dev"],
  build(room) {
    room.add(GameTimer);
    room.add(CrowdSimulation);
    room.add(Gambits);
    room.add(GambitSelection, {
      hand: [
        "personal-anecdote",
        "anecdote-callback",
        "rule-of-three",
        "pious-statement",
        "praise-jesus",
        "t-shirt-cannon",
      ],
      random: false,
      refill: false,
    });
    churchHallShow(room);
  },
});
