import { Random } from "../core/random.ts";
import { BUBBLE, BROWS, DROOL, EYES, MOUTHS, NOSES } from "./audience-face.ts";
import type { AudienceState } from "./audience-model.ts";

/** Which variant of each facial part is drawn. */
export interface FaceParts {
  readonly eyes: keyof typeof EYES;
  readonly brows: keyof typeof BROWS;
  readonly mouth: keyof typeof MOUTHS;
  readonly nose: keyof typeof NOSES;
  readonly drool: keyof typeof DROOL;
  readonly bubble: keyof typeof BUBBLE;
}

/** The still expression a person wears, before any facial motion. */
export function faceFor(state: Readonly<AudienceState>): FaceParts {
  const { approval, engagement } = state;
  if (engagement < 0.15) {
    return parts("closed", "level", "sleep", "still");
  }
  if (engagement < 0.4) {
    const happy = approval > 0.35;
    return parts(
      happy ? "open" : "heavy",
      happy ? "worried" : "level",
      happy ? "smile" : "flat",
      "still",
    );
  }
  if (approval <= -0.55) return parts("open", "angry", "frownTight", "still");
  if (approval >= 0.75) return parts("squint", "level", "grin", "still");
  if (approval >= 0.3) return parts("open", "level", "smile", "still");
  if (approval <= -0.25) return parts("open", "worried", "frown", "still");
  return engagement >= 0.8
    ? parts("open", "attentive", "lineSmall", "still")
    : parts("open", "level", "line", "still");
}

function parts(
  eyes: FaceParts["eyes"],
  brows: FaceParts["brows"],
  mouth: FaceParts["mouth"],
  nose: FaceParts["nose"],
): FaceParts {
  return { eyes, brows, mouth, nose, drool: "none", bubble: "none" };
}

/** Per-person timing so a crowd never blinks or breathes in unison. */
export interface FaceRhythm {
  /** Average seconds between blinks. */
  readonly blinkEvery: number;
  /** Seconds each blink closes the eyes for. */
  readonly blinkFor: number;
  /** Seconds between nose twitches. */
  readonly twitchEvery: number;
  /** Seconds per breath of the sleep bubble. */
  readonly breathEvery: number;
  /** Seconds of sustained disengagement before drool appears. */
  readonly droolAfter: number;
  /** Seconds of sustained disengagement before a nod-off bubble appears. */
  readonly bubbleAfter: number;
}

export function randomFaceRhythm(seed: number): FaceRhythm {
  const rng = new Random(seed);
  return Object.freeze({
    blinkEvery: 2.6 + rng.next() * 3.4,
    blinkFor: 0.09 + rng.next() * 0.06,
    twitchEvery: 7 + rng.next() * 9,
    breathEvery: 3.4 + rng.next() * 2.2,
    droolAfter: 4 + rng.next() * 3,
    bubbleAfter: 6 + rng.next() * 4,
  });
}

/** The animated face: a still expression plus the brief motions layered on top. */
export interface FaceAnimation {
  /** Where the animation currently is. */
  readonly parts: FaceParts;
  update(dt: number, state: Readonly<AudienceState>): FaceParts;
}

/**
 * Drives brief facial motion from a still expression. It reads state but never
 * changes it, so approval and engagement stay the caller's business.
 */
export function animateFace(rhythm: FaceRhythm, seed: number): FaceAnimation {
  const rng = new Random(seed ^ 0x5bf03635);
  let elapsed = 0;
  let blinkLeft = 0;
  let nextBlink = rhythm.blinkEvery * (0.4 + rng.next());
  let doubleBlink = false;
  /** Seconds the current expression has been in play, for sustained reactions. */
  let lowEngagementFor = 0;
  let speakingFor = 0;
  let nextSpeak = 3 + rng.next() * 5;

  let current = faceFor({ approval: 0, engagement: 0.5 });
  return {
    get parts() {
      return current;
    },
    update(dt, state) {
      elapsed += dt;
      const base = faceFor(state);

      // Sustained low engagement is what earns drool and a sleep bubble; a
      // momentary dip must not.
      lowEngagementFor = state.engagement < 0.4 ? lowEngagementFor + dt : 0;
      const drool = lowEngagementFor > rhythm.droolAfter;
      const asleep = state.engagement < 0.15 && lowEngagementFor > rhythm.bubbleAfter;

      // Blinks are irregular, and occasionally double.
      if (blinkLeft > 0) blinkLeft -= dt;
      else if (elapsed >= nextBlink) {
        blinkLeft = rhythm.blinkFor;
        doubleBlink = rng.next() < 0.18;
        nextBlink = elapsed + rhythm.blinkEvery * (0.55 + rng.next() * 0.9);
      }
      const blinking = blinkLeft > 0;
      if (blinking && doubleBlink && blinkLeft < dt) {
        blinkLeft = rhythm.blinkFor;
        doubleBlink = false;
      }

      // Mouths move within the expression, but listeners must not look like
      // they are talking non-stop.
      speakingFor = Math.max(0, speakingFor - dt);
      if (speakingFor === 0) {
        nextSpeak -= dt;
        if (nextSpeak <= 0) {
          speakingFor = 0.18 + rng.next() * 0.22;
          nextSpeak = 2.5 + rng.next() * 5;
        }
      }
      const talking = speakingFor > 0 && state.engagement >= 0.4;

      const breath = 0.5 - 0.5 * Math.cos((Math.PI * 2 * elapsed) / rhythm.breathEvery);
      const twitch = elapsed % rhythm.twitchEvery < 0.22;

      const parts: FaceParts = {
        ...base,
        eyes: blinking ? (asleep ? "closed" : "blink") : base.eyes,
        mouth: talking ? mouthWhileTalking(base.mouth) : base.mouth,
        nose: twitch ? "twitch" : base.nose,
        drool: drool ? (lowEngagementFor > rhythm.droolAfter + 3 ? "long" : "starting") : "none",
        bubble: asleep ? bubbleFor(breath) : "none",
      };
      current = parts;
      return parts;
    },
  };
}

/** A mouth moves within its expression rather than switching to a new one. */
function mouthWhileTalking(mouth: FaceParts["mouth"]): FaceParts["mouth"] {
  switch (mouth) {
    case "line":
      return "lineSmall";
    case "lineSmall":
      return "parted";
    case "smile":
    case "smileWide":
      return "smileWide";
    case "frown":
    case "frownTight":
      return "frownTight";
    case "grin":
      return "open";
    default:
      return mouth;
  }
}

function bubbleFor(breath: number): FaceParts["bubble"] {
  if (breath < 0.25) return "tiny";
  if (breath < 0.6) return "small";
  return "big";
}
