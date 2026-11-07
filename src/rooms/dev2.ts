import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { fillSeats } from "../prefabs/audience-member.ts";
import { slab } from "../prefabs/blocks.ts";
import { chair } from "../prefabs/chair.ts";
import { CameraView } from "../traits/camera-view.ts";
import { GameTimer } from "../traits/game-timer.ts";
import { Light } from "../traits/light.ts";

/** A small room for watching the one-minute meter run. */
rooms.register({
  name: "dev2",
  title: "Round timer",
  tags: ["dev"],
  build(room) {
    room.add(GameTimer);
    room.add(CameraView, { position: [0, 1.6, 3.2], lookAt: [0, 0.75, 0], fov: 35 });
    spawnSpec(room, slab("floor", [6, 0.1, 6], [0, -0.05, 0], 0x9a6b3f));
    spawnSpec(room, slab("backdrop", [6, 4, 0.1], [0, 2, -1.5], 0xe6dcc3));
    spawnSpec(room, {
      kind: "light",
      traits: [trait(Light, { kind: "hemisphere", color: 0xfff4e0, groundColor: 0x6b4a2b })],
    });
    fillSeats(spawnSpec(room, chair()));
  },
});
