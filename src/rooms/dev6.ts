import { rooms } from "../core/room-registry.ts";
import { churchHallShow } from "../scenes/church-hall-show.ts";
import { CrowdSimulation } from "../traits/crowd-simulation.ts";
import { GambitSelection } from "../traits/gambit-selection.ts";
import { Gambits } from "../traits/gambits.ts";
import { GameTimer } from "../traits/game-timer.ts";

/** A fixed T-shirt cannon hand for checking its volley and audience reactions. */
rooms.register({
  name: "dev6",
  title: "T-shirt cannon",
  tags: ["dev"],
  build(room) {
    room.add(GameTimer);
    room.add(CrowdSimulation);
    room.add(Gambits);
    room.add(GambitSelection, { hand: ["t-shirt-cannon"], random: false });
    churchHallShow(room);
  },
});
