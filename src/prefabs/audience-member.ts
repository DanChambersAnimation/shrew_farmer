import { MOODS, SEAT_POINT, randomLook } from "../characters/audience.ts";
import type { GameObject } from "../core/game-object.ts";
import { type ObjectSpec, spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Billboard } from "../traits/billboard.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { PaperFigure } from "../traits/paper-figure.ts";
import { Seat } from "../traits/seat.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

/** A seated audience member with a random (but repeatable) look and mood. */
export function audienceMember(seed: number, position: Vec3 = [0, 0, 0]): ObjectSpec {
  const look = randomLook(seed);
  const mood = MOODS[look.mood];
  return {
    kind: "audience-member",
    traits: [
      trait(Transform, { position }),
      trait(PaperFigure, {
        rig: "audience",
        slots: look.slots,
        params: look.params,
        anchor: [...SEAT_POINT],
      }),
      trait(Billboard),
      trait(Inspectable, {
        title: `Audience member · ${mood.label}`,
        description: mood.description,
      }),
      trait(Highlight, { intensity: 0.25 }),
    ],
  };
}

/** Seat an audience member on every empty `Seat` at or under `root`. Seeds count up from `firstSeed`. */
export function fillSeats(root: GameObject, firstSeed = 1): GameObject[] {
  let seed = firstSeed;
  return [root, ...root.descendants()]
    .filter((o) => o.has(Seat) && !o.children.some((c) => c.kind === "audience-member"))
    .map((seat) => spawnSpec(seat, audienceMember(seed++, seat.settingsOf(Seat)!.sitPoint)));
}
