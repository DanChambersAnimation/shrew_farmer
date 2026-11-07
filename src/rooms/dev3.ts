import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { STAGE, churchHall } from "../locations/church-hall.ts";
import { fillSeats } from "../prefabs/audience-member.ts";
import { speaker } from "../prefabs/speaker.ts";
import { CameraView } from "../traits/camera-view.ts";
import { CrowdSimulation } from "../traits/crowd-simulation.ts";
import { Gambits } from "../traits/gambits.ts";
import { GambitSelection } from "../traits/gambit-selection.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { LookAround } from "../traits/look-around.ts";

/** dev0 plus the round clock and the crowd simulation: the room the game is played in. */
rooms.register({
  name: "dev3",
  title: "Playable church hall",
  tags: ["dev"],
  build(room) {
    room.add(GameTimer);
    room.add(CrowdSimulation);
    // GambitSelection fills the hand; Gambits tracks what has been used up.
    room.add(Gambits, { hand: [], played: [], lastUsedAt: {}, finished: false });
    room.add(GambitSelection, { count: 5, random: true });
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
