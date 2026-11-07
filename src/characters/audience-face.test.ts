import { describe, expect, it } from "vite-plus/test";
import type { AudienceState } from "./audience-model.ts";
import { animateFace, faceFor, randomFaceRhythm } from "./audience-face-model.ts";

const steady = (approval: number, engagement: number): AudienceState => ({ approval, engagement });

/** Run the animation for `seconds`, sampling every frame. */
function run(
  rhythm = randomFaceRhythm(1),
  seed = 1,
  state: AudienceState = steady(0.5, 0.9),
  seconds = 20,
) {
  const face = animateFace(rhythm, seed);
  const frames = [];
  for (let i = 0; i < seconds * 60; i++) frames.push(face.update(1 / 60, state));
  return { face, frames };
}

describe("face expressions", () => {
  it("derives a still expression from approval and engagement", () => {
    expect(faceFor(steady(0, 0.05)).eyes).toBe("closed");
    expect(faceFor(steady(0.9, 0.9)).mouth).toBe("grin");
    expect(faceFor(steady(-0.9, 0.9)).brows).toBe("angry");
    expect(faceFor(steady(0.5, 0.6)).mouth).toBe("smile");
    expect(faceFor(steady(0, 0.2)).mouth).toBe("flat");
  });

  it("gives every expression a nose and no drool or bubble to begin with", () => {
    for (const approval of [-1, 0, 1]) {
      for (const engagement of [0, 0.2, 0.5, 1]) {
        const face = faceFor(steady(approval, engagement));
        expect(face.nose).toBe("still");
        expect(face.drool).toBe("none");
        expect(face.bubble).toBe("none");
      }
    }
  });
});

describe("facial animation", () => {
  it("varies timing per person but repeats for a given seed", () => {
    expect(randomFaceRhythm(7)).toEqual(randomFaceRhythm(7));
    const rhythms = Array.from({ length: 40 }, (_, seed) => randomFaceRhythm(seed));
    expect(new Set(rhythms.map((r) => r.blinkEvery)).size).toBeGreaterThan(30);
    expect(rhythms.every((r) => r.blinkFor > 0.05 && r.blinkFor < 0.2)).toBe(true);
    expect(rhythms.every((r) => r.droolAfter > r.blinkFor)).toBe(true);
  });

  it("blinks occasionally and irregularly rather than on a fixed beat", () => {
    const { frames } = run();
    const blinks: number[] = [];
    let wasOpen = true;
    for (const [i, frame] of frames.entries()) {
      const closed = frame.eyes === "blink";
      if (closed && wasOpen) blinks.push(i);
      wasOpen = !closed;
    }
    expect(blinks.length).toBeGreaterThan(2);
    const gaps = blinks.slice(1).map((at, i) => at - blinks[i]!);
    expect(new Set(gaps).size).toBeGreaterThan(1);
  });

  it("leaves a listener's expression mostly still, with the odd brief mouth movement", () => {
    const { frames } = run();
    const resting = faceFor(steady(0.5, 0.9)).mouth;
    const talking = frames.filter((f) => f.mouth !== resting);
    // Never continuously talking, but not frozen either.
    expect(talking.length).toBeGreaterThan(0);
    expect(talking.length / frames.length).toBeLessThan(0.2);
  });

  it("never changes the person's state while animating", () => {
    const state = steady(0.4, 0.7);
    const before = { ...state };
    const face = animateFace(randomFaceRhythm(3), 3);
    for (let i = 0; i < 600; i++) face.update(1 / 60, state);
    expect(state).toEqual(before);
  });

  it("adds drool only after sustained disengagement, and clears it on re-engagement", () => {
    const rhythm = randomFaceRhythm(5);
    const face = animateFace(rhythm, 5);
    const low = steady(0, 0.25);

    face.update(1, low);
    expect(face.parts.drool).toBe("none"); // a momentary dip is not enough
    for (let i = 0; i < 10; i++) face.update(1, low);
    expect(face.parts.drool).not.toBe("none");

    face.update(1, steady(0, 0.9));
    expect(face.parts.drool).toBe("none");
  });

  it("shows a breathing sleep bubble only for someone who has nodded off", () => {
    const rhythm = randomFaceRhythm(5);
    const face = animateFace(rhythm, 5);
    const asleep = steady(0, 0.05);
    for (let i = 0; i < 12; i++) face.update(1, asleep);
    expect(face.parts.bubble).not.toBe("none");

    const sizes = new Set<string>();
    for (let i = 0; i < 400; i++) sizes.add(face.update(1 / 60, asleep).bubble);
    expect(sizes.size).toBeGreaterThan(1); // it breathes

    // Waking up pops it.
    face.update(1, steady(0, 0.9));
    expect(face.parts.bubble).toBe("none");
  });
});
