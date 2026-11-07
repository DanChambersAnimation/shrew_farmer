import { rooms } from "../core/room-registry.ts";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { createAudienceMember } from "../prefabs/audience-member.ts";
import { slab } from "../prefabs/blocks.ts";
import { chair } from "../prefabs/chair.ts";
import { CameraView } from "../traits/camera-view.ts";
import { Light } from "../traits/light.ts";
import { Seat } from "../traits/seat.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

/** One listener in the row, and the state that gives them a particular face. */
const ROW = [
  { approval: 1, engagement: 0.95 }, // delighted
  { approval: 0.5, engagement: 0.6 }, // interested
  { approval: 0, engagement: 0.85 }, // watching intently
  { approval: -0.4, engagement: 0.7 }, // reservations
  { approval: -0.8, engagement: 0.9 }, // unconvinced
  { approval: 0.2, engagement: 0.3 }, // distracted
  { approval: 0, engagement: 0.05 }, // asleep, with a bubble
] as const;

/** A row of listeners, one of each expression, to watch faces move out of step. */
rooms.register({
  name: "dev5",
  title: "Faces",
  tags: ["dev"],
  build(room) {
    room.add(CameraView, { position: [0, 1.7, 3.4], lookAt: [0, 0.8, 0], fov: 38 });
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
    ROW.forEach((state, index) => {
      const x = (index - (ROW.length - 1) / 2) * 0.78;
      const seated = spawnSpec(room, chair([x, 0, 0]));
      const sitPoint = seated.settingsOf(Seat)?.sitPoint ?? ([0, 0, 0] as Vec3);
      spawnSpec(seated, createAudienceMember(sitPoint, 100 + index, { ...state }));
    });
  },
});
