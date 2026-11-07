import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { HALL } from "../locations/church-hall.ts";
import { spotlight } from "../prefabs/spotlight.ts";
import { churchHallShow } from "../scenes/church-hall-show.ts";
import { Haze } from "../traits/haze.ts";
import { LightingCues } from "../traits/lighting-cues.ts";

/** The church hall show with lighting states (L): house lights, or a spotlight. */
rooms.register({
  name: "dev2",
  title: "Stage lighting",
  tags: ["dev"],
  build(room) {
    // Added first so lights start at the first cue's levels.
    room.add(LightingCues, {
      cues: {
        "House lights": { house: 1, spot: 0 },
        // A cheat: house lights stay faintly up so the audience stays visible.
        Spotlight: { house: 0.3, spot: 1 },
      },
    });
    // A slight haze, so the spotlight's beam shows in the air.
    room.add(Haze);
    const { speakerAt: at } = churchHallShow(room);
    // A ceiling spot above and in front of him (on the audience side): the light
    // pools at his feet and throws his shadow back toward us.
    spawnSpec(
      room,
      spotlight([at[0], HALL.height - 0.1, at[2] - 2.2], [at[0], at[1], at[2] + 0.3], { beam: 1 }),
    );
  },
});
