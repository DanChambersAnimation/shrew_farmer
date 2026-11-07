import { SPEAKER_FEET, SPEAKER_JOINTS } from "../characters/speaker.ts";
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
 * front or back rig; both share the same slots, so poses carry over. `yaw`
 * turns him from squarely facing the camera.
 */
export function speaker(
  position: Vec3,
  view: "front" | "back" = "back",
  /** Turn from facing the camera, degrees (positive = anticlockwise from above). */
  yaw = 0,
): ObjectSpec {
  return {
    kind: "speaker",
    traits: [
      trait(Transform, { position }),
      trait(PaperFigure, {
        rig: view === "back" ? "speaker-back" : "speaker",
        anchor: [...SPEAKER_FEET],
        castShadow: true,
        // Turning to look: the body turns from the waist, half way by the
        // shoulders; the flat head turns fully from the neck up.
        twist: {
          degrees: 0,
          curve: [
            [SPEAKER_JOINTS.waist, 0],
            [SPEAKER_JOINTS.shoulders, 0.5],
            [SPEAKER_JOINTS.neck, 1],
          ],
        },
      }),
      // Turn toward the camera but stay perpendicular to the floor.
      trait(Billboard, { mode: "upright", yaw }),
      trait(Inspectable, {
        title: "You · The Speaker",
        description: "Slick hair, dark glasses, shiny suit. Ready to inspire.",
      }),
      trait(Highlight, { intensity: 0.08 }),
    ],
  };
}
