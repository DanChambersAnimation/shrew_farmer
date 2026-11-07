import { SPEAKER_FEET } from "../characters/speaker.ts";
import type { ObjectSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Billboard } from "../traits/billboard.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { PaperFigure } from "../traits/paper-figure.ts";
import { Transform } from "../traits/transform.ts";
import type { Vec3 } from "../traits/types.ts";

/**
 * The player character, standing with his feet at `position`. `view` picks the
 * front or back rig; both share the same slots, so poses carry over.
 */
export function speaker(position: Vec3, view: "front" | "back" = "back"): ObjectSpec {
  return {
    kind: "speaker",
    traits: [
      trait(Transform, { position }),
      trait(PaperFigure, {
        rig: view === "back" ? "speaker-back" : "speaker",
        anchor: [...SPEAKER_FEET],
      }),
      // Stay upright so his feet stay planted on the stage.
      trait(Billboard, { mode: "upright" }),
      trait(Inspectable, {
        title: "You · The Speaker",
        description: "Slick hair, dark glasses, shiny suit. Ready to inspire.",
      }),
      trait(Highlight, { intensity: 0.15 }),
    ],
  };
}
