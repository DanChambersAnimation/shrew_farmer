import { Vector3 } from "three";
import { AUDIO_CLIPS } from "../audio/clips.ts";
import {
  type Bed,
  playBed,
  playReaction,
  resetReactions,
  setAudioListenerPose,
} from "../audio/player.ts";
import { MOODS, moodOf, type Mood } from "../characters/mood.ts";
import type { GameObject } from "../core/game-object.ts";
import { Random } from "../core/random.ts";
import { defineTrait } from "../core/trait.ts";
import { AudienceModel } from "./audience-model.ts";
import { AudienceVoice, type AudienceVoiceName } from "./audience-voice.ts";
import { GameTimer } from "./game-timer.ts";
import { MOOD_CHANGED, type MoodChange } from "./mood-watch.ts";
import { Seat } from "./seat.ts";
import type { Vec3 } from "./types.ts";

/** The chosen person and clip; useful for captions and later speech bubbles. */
export const AUDIENCE_SPOKE = "audience-spoke";

export interface AudienceSpoke {
  readonly who: GameObject;
  readonly clipId: string;
  readonly position: Vec3;
  readonly atSeconds: number;
}

/** Mood lines indexed by the voice that belongs to the person speaking. */
const LINE_BANK = new Map<string, string[]>();
for (const clip of AUDIO_CLIPS) {
  if (clip.category !== "crowd" || clip.kind !== "speech") continue;
  const mood = clip.id.split("/")[1];
  if (!mood || !MOODS.some((band) => band === mood)) continue;
  const key = `${mood}/${clip.voiceName}`;
  const pool = LINE_BANK.get(key) ?? [];
  pool.push(clip.id);
  LINE_BANK.set(key, pool);
}

export function crowdLineIds(mood: Mood, voice: AudienceVoiceName): readonly string[] {
  return LINE_BANK.get(`${mood}/${voice}`) ?? [];
}

interface Member {
  readonly object: GameObject;
  readonly state: { readonly approval: number; readonly engagement: number };
  readonly voice: AudienceVoiceName;
}

/** The centre of a seated person's face, in the room's world coordinates. */
function mouthPosition(member: GameObject): Vec3 {
  const position = member.node.getWorldPosition(new Vector3());
  return [position.x, position.y + 0.7, position.z];
}

/**
 * The audience's own noise. A line belongs to one seated person, uses that
 * person's fixed voice, and comes from their seat. Applause and snoring remain
 * diffuse beds. A short hold coalesces simultaneous mood swings into one line.
 */
export const CrowdAudio = defineTrait({
  name: "crowd-audio",
  defaults: {
    quietest: 3.5,
    loudest: 9,
    clapApproval: 0.75,
    clapEngagement: 0.8,
    clapThreshold: 2,
    asleepBelow: 0.15,
    snoreThreshold: 3,
    seed: 0,
  },
  setup({ object: room, world, settings: s }) {
    resetReactions();
    const rng = new Random(s.seed || 1);
    let elapsed = 0;
    let sinceLastLine = 0;
    let lastClip: string | null = null;
    let clap: Bed | null = null;
    let snore: Bed | null = null;
    const pending = new Map<GameObject, Mood>();
    let held = 0;

    const members = (): Member[] =>
      [...room.descendants()]
        .filter(
          (object) =>
            object.has(AudienceModel) && object.has(AudienceVoice) && object.parent?.has(Seat),
        )
        .map((object) => ({
          object,
          state: object.settingsOf(AudienceModel)!.state,
          voice: object.settingsOf(AudienceVoice)!.voiceName,
        }));

    const speak = (member: Member, mood: Mood, gapSeconds: number): boolean => {
      const pool = crowdLineIds(mood, member.voice);
      if (pool.length === 0) return false;
      const fresh = pool.filter((id) => id !== lastClip);
      const clipId = rng.pick(fresh.length > 0 ? fresh : pool);
      const position = mouthPosition(member.object);
      if (!playReaction(clipId, { atSeconds: elapsed, gapSeconds, position })) return false;
      lastClip = clipId;
      sinceLastLine = 0;
      room.emit(AUDIENCE_SPOKE, {
        who: member.object,
        clipId,
        position,
        atSeconds: elapsed,
      } satisfies AudienceSpoke);
      return true;
    };

    const off = world.events.on(MOOD_CHANGED, (payload) => {
      const change = payload as MoodChange;
      if (change.size < 2 || (change.to !== "ecstatic" && change.to !== "hostile")) return;
      if (!change.who.ancestry().includes(room)) return;
      pending.set(change.who, change.to);
      held = 0;
    });

    return {
      update(dt) {
        const camera = world.camera;
        const eye = camera.getWorldPosition(new Vector3());
        const forward = camera.getWorldDirection(new Vector3());
        const up = camera.up.clone().applyQuaternion(camera.quaternion);
        setAudioListenerPose(
          [eye.x, eye.y, eye.z],
          [forward.x, forward.y, forward.z],
          [up.x, up.y, up.z],
        );

        const clock = room.settingsOf(GameTimer);
        if (clock && !clock.running) {
          pending.clear();
          held = 0;
          sinceLastLine = 0;
          clap?.setLevel(0);
          snore?.setLevel(0);
          return;
        }
        elapsed += dt;
        sinceLastLine += dt;
        const crowd = members();

        if (pending.size > 0) {
          held += dt;
          if (held >= 0.5) {
            const candidates = crowd.filter((member) => pending.has(member.object));
            if (candidates.length > 0) {
              const member = rng.pick(candidates);
              speak(member, pending.get(member.object)!, 0.7);
            }
            pending.clear();
            held = 0;
          }
        }

        if (pending.size === 0 && sinceLastLine >= s.quietest) {
          const due = sinceLastLine >= s.loudest || rng.next() < dt / s.quietest;
          if (due) {
            const eligible = crowd.filter(
              (member) =>
                member.state.engagement >= s.asleepBelow &&
                crowdLineIds(moodOf(member.state), member.voice).length > 0,
            );
            if (eligible.length > 0) {
              const member = rng.pick(eligible);
              speak(member, moodOf(member.state), s.quietest);
            }
          }
        }

        const clapping = crowd.filter(
          (member) =>
            member.state.approval >= s.clapApproval && member.state.engagement >= s.clapEngagement,
        ).length;
        const asleep = crowd.filter((member) => member.state.engagement < s.asleepBelow).length;
        const clapLevel =
          clapping < s.clapThreshold
            ? 0
            : Math.min(0.5, (clapping / Math.max(1, crowd.length)) * 1.2);
        if (clapLevel > 0) clap ??= playBed("crowd/clap/solid", 0);
        clap?.setLevel(clapLevel);

        const snoreLevel = asleep < s.snoreThreshold ? 0 : Math.min(0.35, asleep / 12);
        if (snoreLevel > 0) snore ??= playBed("crowd/snore/soft", 0);
        snore?.setLevel(snoreLevel);
      },
      dispose() {
        off();
        clap?.stop();
        snore?.stop();
        resetReactions();
      },
    };
  },
});
