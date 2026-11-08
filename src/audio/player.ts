import generated from "./audio-lock.json";
import { clips } from "./clips.ts";

interface GeneratedClip {
  readonly requestHash: string;
  readonly fileHash: string;
  readonly bytes: number;
}

const lock: Record<string, GeneratedClip> = generated;
const decoded = new Map<string, Promise<AudioBuffer>>();
const warned = new Set<string>();
let context: AudioContext | null = null;

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

/** Play a static clip; a missing file or blocked context never blocks gameplay. */
export function playRecorded(id: string): void {
  if (typeof AudioContext === "undefined") return;
  try {
    context ??= new AudioContext();
    const audio = context;
    // Call resume before fetching so the gambit click is the browser gesture.
    const resumed = audio.state === "running" ? Promise.resolve() : audio.resume();
    void Promise.all([resumed, bufferFor(id, audio)])
      .then(([, buffer]) => {
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(audio.destination);
        source.start();
        source.onended = () => source.disconnect();
      })
      .catch((error: unknown) => warnOnce(id, error));
  } catch (error) {
    warnOnce(id, error);
  }
}
