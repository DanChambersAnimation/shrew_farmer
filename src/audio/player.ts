import generated from "./audio-lock.json";
import { clips } from "./clips.ts";
import { createCrowdDistanceBus } from "./distance.ts";
import type { Vec3 } from "../traits/types.ts";

interface GeneratedClip {
  readonly requestHash: string;
  readonly fileHash: string;
  readonly bytes: number;
}

const lock: Record<string, GeneratedClip> = generated;
const decoded = new Map<string, Promise<AudioBuffer>>();
const warned = new Set<string>();
let context: AudioContext | null = null;
const crowdDistanceBuses = new WeakMap<AudioContext, AudioNode>();
let listenerPose: { position: Vec3; forward: Vec3; up: Vec3 } = {
  position: [0, 0, 0],
  forward: [0, 0, -1],
  up: [0, 1, 0],
};

function applyListenerPose(audio: AudioContext): void {
  const { position, forward, up } = listenerPose;
  const listener = audio.listener;
  [listener.positionX, listener.positionY, listener.positionZ].forEach((axis, i) => {
    axis.value = position[i]!;
  });
  [listener.forwardX, listener.forwardY, listener.forwardZ].forEach((axis, i) => {
    axis.value = forward[i]!;
  });
  [listener.upX, listener.upY, listener.upZ].forEach((axis, i) => {
    axis.value = up[i]!;
  });
}

/** Match the audio listener to the game camera; this also works before audio unlocks. */
export function setAudioListenerPose(position: Vec3, forward: Vec3, up: Vec3 = [0, 1, 0]): void {
  listenerPose = { position, forward, up };
  if (context) applyListenerPose(context);
}

function warnOnce(id: string, error: unknown): void {
  if (warned.has(id)) return;
  warned.add(id);
  console.warn(`Audio clip ${id} could not play`, error);
}

/** A committed file URL that works under the site's relative GitHub Pages base. */
export function clipUrl(id: string): string {
  const clip = clips.get(id);
  const version = lock[id]?.fileHash;
  if (!version) throw new Error(`No generated file recorded for ${id}`);
  const base = new URL(import.meta.env.BASE_URL, document.baseURI);
  return new URL(`audio/${clip.filename}?v=${version.slice(0, 12)}`, base).href;
}

function bufferFor(id: string, audio: AudioContext): Promise<AudioBuffer> {
  let pending = decoded.get(id);
  if (!pending) {
    pending = fetch(clipUrl(id))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => audio.decodeAudioData(bytes));
    decoded.set(id, pending);
    // A transient fetch or decode error should allow a later attempt.
    void pending.catch(() => decoded.delete(id));
  }
  return pending;
}

/** Keep audience recordings behind the Speaker while other cues remain direct. */
export function outputForClip(id: string, audio: AudioContext): AudioNode {
  if (clips.get(id).category !== "crowd") return audio.destination;
  let bus = crowdDistanceBuses.get(audio);
  if (!bus) {
    bus = createCrowdDistanceBus(audio);
    crowdDistanceBuses.set(audio, bus);
  }
  return bus;
}

/** Play a static clip; a missing file or blocked context never blocks gameplay. */
export function playRecorded(id: string, position?: Vec3): void {
  if (typeof AudioContext === "undefined") return;
  try {
    context ??= new AudioContext();
    const audio = context;
    applyListenerPose(audio);
    // Call resume before fetching so the gambit click is the browser gesture.
    const resumed = audio.state === "running" ? Promise.resolve() : audio.resume();
    void Promise.all([resumed, bufferFor(id, audio)])
      .then(([, buffer]) => {
        const source = audio.createBufferSource();
        source.buffer = buffer;
        let panner: PannerNode | null = null;
        if (position) {
          panner = audio.createPanner();
          panner.panningModel = "HRTF";
          panner.distanceModel = "linear";
          panner.refDistance = 1;
          panner.maxDistance = 20;
          panner.rolloffFactor = 0.7;
          [panner.positionX, panner.positionY, panner.positionZ].forEach((axis, i) => {
            axis.value = position[i]!;
          });
          source.connect(panner).connect(outputForClip(id, audio));
        } else {
          source.connect(outputForClip(id, audio));
        }
        source.start();
        source.onended = () => {
          source.disconnect();
          panner?.disconnect();
        };
      })
      .catch((error: unknown) => warnOnce(id, error));
  } catch (error) {
    warnOnce(id, error);
  }
}

/** A looping bed that can fade in and out, e.g. clapping or the room's air. */
export interface Bed {
  /** 0 to 1, how loud it should be; the bed follows with a short ramp. */
  setLevel(level: number): void;
  stop(): void;
}

/**
 * Start a looping clip at `level`. Returns null in a headless run or when the
 * file cannot be fetched, so a missing bed never blocks anything.
 */
export function playBed(id: string, level = 0, crossfadeSeconds = 0.6): Bed | null {
  if (typeof AudioContext === "undefined") return null;
  let source: AudioBufferSourceNode | null = null;
  let gain: GainNode | null = null;
  let stopped = false;
  let wanted = level;
  try {
    context ??= new AudioContext();
    const audio = context;
    applyListenerPose(audio);
    const resumed = audio.state === "running" ? Promise.resolve() : audio.resume();
    void Promise.all([resumed, bufferFor(id, audio)])
      .then(([, buffer]) => {
        if (stopped) return;
        source = audio.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        gain = audio.createGain();
        gain.gain.setValueAtTime(0.0001, audio.currentTime);
        // Ramp rather than jump, so a bed never clicks.
        gain.gain.linearRampToValueAtTime(
          Math.max(0.0001, wanted),
          audio.currentTime + crossfadeSeconds,
        );
        source.connect(gain).connect(outputForClip(id, audio));
        source.start();
      })
      .catch((error: unknown) => warnOnce(id, error));
  } catch (error) {
    warnOnce(id, error);
    return null;
  }
  return {
    setLevel(next) {
      wanted = next;
      if (!gain || !context) return;
      gain.gain.cancelScheduledValues(context.currentTime);
      gain.gain.linearRampToValueAtTime(
        Math.max(0.0001, Math.min(1, next)),
        context.currentTime + crossfadeSeconds,
      );
    },
    stop() {
      stopped = true;
      if (!source || !context) return;
      const end = context.currentTime + crossfadeSeconds;
      gain?.gain.linearRampToValueAtTime(0.0001, end);
      source.stop(end + 0.02);
      source.onended = () => {
        source?.disconnect();
        gain?.disconnect();
      };
    },
  };
}

let lastReactionAt: number | null = null;

export interface ReactionOptions {
  readonly atSeconds: number;
  readonly gapSeconds?: number;
  readonly position: Vec3;
}

/**
 * Play a line from one member's position, with a minimum gap between voices.
 */
export function playReaction(id: string, options: ReactionOptions): boolean {
  if (lastReactionAt !== null && options.atSeconds - lastReactionAt < (options.gapSeconds ?? 0.7)) {
    return false;
  }
  lastReactionAt = options.atSeconds;
  playRecorded(id, options.position);
  return true;
}

/** Forget the reaction limiter, e.g. when a new round starts. */
export function resetReactions(): void {
  lastReactionAt = null;
}
