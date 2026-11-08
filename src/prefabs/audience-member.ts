import { LANDMARKS, SEAT_POINT, randomAppearance, seatedProfile } from "../characters/audience.ts";
import {
  audienceVisual,
  randomAudienceState,
  randomPersonality,
  type AudienceState,
} from "../characters/audience-model.ts";
import type { GameObject } from "../core/game-object.ts";
import { type ObjectSpec, spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { Billboard } from "../traits/billboard.ts";
import { Highlight } from "../traits/highlight.ts";
import { Inspectable } from "../traits/inspectable.ts";
import { PaperFigure } from "../traits/paper-figure.ts";
import { Seat } from "../traits/seat.ts";
import { TiltToCamera } from "../traits/tilt-to-camera.ts";
import { Transform } from "../traits/transform.ts";
import { AudienceModel, randomAudienceMotion } from "../traits/audience-model.ts";
import { AudienceVoice, audienceVoiceFor } from "../traits/audience-voice.ts";
import { MoodWatch } from "../traits/mood-watch.ts";
import { faceFor, randomFaceRhythm } from "../characters/audience-face-model.ts";
import type { Vec3 } from "../traits/types.ts";

const SCALE = 0.004;

/** Create one seated audience member. A supplied seed makes generation repeatable. */
export function createAudienceMember(
  position: Vec3 = [0, 0, 0],
  seed = Math.floor(Math.random() * 0x100000000),
  state: AudienceState = randomAudienceState(seed ^ 0x6c2b79f5),
): ObjectSpec {
  const appearance = randomAppearance(seed);
  const personality = randomPersonality(seed ^ 0x9e3779b9);
  const visual = audienceVisual(state);
  const face = faceFor(state);
  return {
    kind: "audience-member",
    traits: [
      trait(Transform, { position }),
      trait(PaperFigure, {
        rig: "audience",
        slots: { ...appearance.slots, ...face, arms: visual.arms },
        params: appearance.params,
        scale: SCALE,
        anchor: [...SEAT_POINT],
        profile: seatedProfile(SCALE, position[1]),
        // Heads tip back at the neck (set by TiltToCamera below).
        lean: { degrees: 0, from: LANDMARKS.neck },
        // Faces stay readable when the house lights go down.
        selfLight: 0.35,
      }),
      // Turn (not tilt) toward the camera, so the bent figure stays in its chair.
      trait(Billboard, { mode: "upright" }),
      // Tip the head back so the face stays flat-on to the camera.
      trait(TiltToCamera),
      trait(Inspectable, {
        title: "Audience member",
        description: visual.description,
      }),
      trait(Highlight, { intensity: 0.08 }),
      trait(AudienceModel, {
        appearance,
        personality,
        state: { ...state },
        motion: randomAudienceMotion(seed ^ 0x85ebca6b),
        memory: [],
        face: randomFaceRhythm(seed ^ 0x27d4eb2f),
        faceSeed: seed ^ 0x165667b1,
      }),
      trait(AudienceVoice, { voiceName: audienceVoiceFor(seed) }),
      // Announces mood changes (e.g. for speech bubbles).
      trait(MoodWatch),
    ],
  };
}

/** Seat an audience member on every empty `Seat` at or under `root`. Seeds count up from `firstSeed`. */
export function fillSeats(root: GameObject, firstSeed = 1): GameObject[] {
  let seed = firstSeed;
  return [root, ...root.descendants()]
    .filter((o) => o.has(Seat) && !o.children.some((c) => c.kind === "audience-member"))
    .map((seat) => spawnSpec(seat, createAudienceMember(seat.settingsOf(Seat)!.sitPoint, seed++)));
}
