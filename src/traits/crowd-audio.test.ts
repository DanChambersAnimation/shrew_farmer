import { describe, expect, it } from "vite-plus/test";
import { World } from "../core/world.ts";
import { spawnSpec } from "../core/spec.ts";
import { trait } from "../core/trait.ts";
import { createAudienceMember } from "../prefabs/audience-member.ts";
import { AUDIO_CLIPS } from "../audio/clips.ts";
import { MOODS } from "../characters/mood.ts";
import { AUDIENCE_VOICES, AudienceVoice } from "./audience-voice.ts";
import { AUDIENCE_SPOKE, CrowdAudio, crowdLineIds, type AudienceSpoke } from "./crowd-audio.ts";
import { MOOD_CHANGED } from "./mood-watch.ts";
import { Seat } from "./seat.ts";
import { Transform } from "./transform.ts";

/** A room with a crowd of given states, each on its own seat. */
function crowd(states: readonly { approval: number; engagement: number }[]) {
  const world = new World();
  const room = world.createRoot("room").add(CrowdAudio, { seed: 3 });
  states.forEach((state, index) => {
    const seat = spawnSpec(room, {
      kind: "chair",
      traits: [trait(Transform, { position: [index, 0, 0] }), trait(Seat)],
    });
    spawnSpec(seat, createAudienceMember([0, 0.5, 0], 100 + index, { ...state }));
  });
  return { world, room };
}

describe("CrowdAudio", () => {
  it("has a spoken line recorded for every mood band", () => {
    const speech = AUDIO_CLIPS.filter(
      (clip) => clip.category === "crowd" && clip.kind === "speech",
    );
    const bands = new Set(speech.map((clip) => clip.id.split("/")[1]));
    for (const mood of [
      "ecstatic",
      "delighted",
      "interested",
      "neutral",
      "bored",
      "asleep",
      "sceptical",
      "hostile",
    ]) {
      expect(bands.has(mood)).toBe(true);
    }
    for (const mood of MOODS) {
      for (const voice of AUDIENCE_VOICES)
        expect(crowdLineIds(mood, voice).length).toBeGreaterThan(0);
    }
  });

  it("attributes each line to one seated person, using their stable voice and position", () => {
    const { world, room } = crowd([
      { approval: 0.9, engagement: 0.9 },
      { approval: 0.2, engagement: 0.7 },
      { approval: -0.8, engagement: 0.8 },
    ]);
    const spoken: AudienceSpoke[] = [];
    room.on(AUDIENCE_SPOKE, (event) => spoken.push(event as AudienceSpoke));
    for (let i = 0; i < 30; i++) world.update(0.5);
    expect(spoken.length).toBeGreaterThan(0);
    expect(new Set(spoken.map((event) => event.who)).size).toBeGreaterThan(1);
    for (const event of spoken) {
      const clip = AUDIO_CLIPS.find((candidate) => candidate.id === event.clipId);
      expect(clip?.kind).toBe("speech");
      if (clip?.kind !== "speech") continue;
      expect(clip.voiceName).toBe(event.who.settingsOf(AudienceVoice)!.voiceName);
      const seatX = event.who.parent!.node.position.x;
      // The rig sways by a few centimetres around its own chair.
      expect(Math.abs(event.position[0] - seatX)).toBeLessThan(0.04);
      expect(event.position[1]).toBeGreaterThan(0.5);
    }
  });

  it("coalesces simultaneous large mood swings into one identifiable voice", () => {
    const { world, room } = crowd([
      { approval: 0.8, engagement: 0.9 },
      { approval: 0.8, engagement: 0.9 },
      { approval: 0.8, engagement: 0.9 },
    ]);
    const people = [...room.descendants()].filter((object) => object.has(AudienceVoice));
    const spoken: AudienceSpoke[] = [];
    room.on(AUDIENCE_SPOKE, (event) => spoken.push(event as AudienceSpoke));
    for (const who of people) {
      world.events.emit(MOOD_CHANGED, { who, from: "neutral", to: "ecstatic", size: 3 });
    }
    world.update(0.25);
    expect(spoken).toHaveLength(0);
    world.update(0.3);
    expect(spoken).toHaveLength(1);
    expect(people).toContain(spoken[0]!.who);
  });

  it("does not give spontaneous spoken quips to sleeping members", () => {
    const { world, room } = crowd([{ approval: 0, engagement: 0.05 }]);
    const spoken: AudienceSpoke[] = [];
    room.on(AUDIENCE_SPOKE, (event) => spoken.push(event as AudienceSpoke));
    for (let i = 0; i < 30; i++) world.update(0.5);
    expect(spoken).toHaveLength(0);
  });

  it("has the clapping and snoring beds the trait asks for", () => {
    const ids = new Set(AUDIO_CLIPS.map((clip) => clip.id));
    for (const id of ["crowd/clap/solid", "crowd/snore/soft"]) expect(ids.has(id)).toBe(true);
  });

  it("runs without audio in a headless test and never blocks the round", () => {
    const { world } = crowd([
      { approval: 0.9, engagement: 0.9 },
      { approval: 0.9, engagement: 0.9 },
      { approval: 0, engagement: 0.05 },
    ]);
    // No AudioContext here: the trait must simply do nothing, not throw.
    for (let i = 0; i < 30; i++) world.update(0.5);
  });

  it("counts a quiet room as neither clapping nor snoring heavily", () => {
    const { world, room } = crowd([{ approval: 0.1, engagement: 0.5 }]);
    for (let i = 0; i < 10; i++) world.update(0.5);
    expect(room.settingsOf(CrowdAudio)!.clapThreshold).toBe(2);
  });
});
