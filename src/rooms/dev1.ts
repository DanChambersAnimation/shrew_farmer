import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { slab } from "../prefabs/blocks.ts";
import { chair } from "../prefabs/chair.ts";
import { fillSeats } from "../prefabs/audience-member.ts";
import { CameraView } from "../traits/camera-view.ts";
import { Light } from "../traits/light.ts";
import { Transform } from "../traits/transform.ts";

/** One audience member on one chair, close up. Change the seed to see other people. */
rooms.register({
  name: "dev1",
  title: "One audience member",
  tags: ["dev"],
  build(room) {
    room.add(CameraView, { position: [0, 1.6, 3.2], lookAt: [0, 0.75, 0], fov: 35 });
    spawnSpec(room, slab("floor", [6, 0.1, 6], [0, -0.05, 0], 0x9a6b3f));
    spawnSpec(room, slab("backdrop", [6, 4, 0.1], [0, 2, -1.5], 0xe6dcc3));
    spawnSpec(room, {
      kind: "light",
      traits: [trait(Light, { kind: "hemisphere", color: 0xfff4e0, groundColor: 0x6b4a2b })],
    });
    spawnSpec(room, {
      kind: "light",
      traits: [
        trait(Transform, { position: [1.5, 3, 2.5] }),
        trait(Light, { kind: "point", color: 0xfff1cc, intensity: 25 }),
      ],
    });
    fillSeats(spawnSpec(room, chair()));
  },
});
