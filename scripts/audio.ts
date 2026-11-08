/** Generate and verify committed audio without putting an API key in the game. */
import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AUDIO_CLIPS, type Clip } from "../src/audio/clips.ts";

interface GeneratedClip {
  readonly requestHash: string;
  readonly fileHash: string;
  readonly bytes: number;
}

type Lock = Record<string, GeneratedClip>;
type State = "ready" | "missing" | "stale";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const audioDir = join(root, "public/audio");
const lockPath = join(root, "src/audio/audio-lock.json");

const sha256 = (data: string | Uint8Array): string =>
  createHash("sha256").update(data).digest("hex");

function requestHash(clip: Clip): string {
  return sha256(
    JSON.stringify({
      id: clip.id,
      kind: clip.kind,
      filename: clip.filename,
      request: clip.request,
    }),
  );
}

function validateManifest(): void {
  for (const clip of AUDIO_CLIPS) {
    if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(clip.id)) {
      throw new Error(`Invalid clip id: ${clip.id}`);
    }
    if (clip.filename !== `${clip.id}.mp3` || !clip.id.startsWith(`${clip.category}/`)) {
      throw new Error(`Clip ${clip.id} must use its category/id as the MP3 filename`);
    }
    if (!clip.name || !clip.purpose || !clip.caption || !clip.usedBy) {
      throw new Error(`Clip ${clip.id} is missing review metadata`);
    }
  }
}

async function readLock(): Promise<Lock> {
  return JSON.parse(await readFile(lockPath, "utf8")) as Lock;
}

async function stateOf(clip: Clip, lock: Lock): Promise<State> {
  let bytes: Uint8Array;
  try {
    bytes = await readFile(join(audioDir, clip.filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing";
    throw error;
  }
  const record = lock[clip.id];
  if (!record || record.requestHash !== requestHash(clip)) return "stale";
  return record.bytes === bytes.length && record.fileHash === sha256(bytes) ? "ready" : "stale";
}

async function orphanFiles(directory = audioDir): Promise<string[]> {
  const found: string[] = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await orphanFiles(path)));
    else if (entry.name.endsWith(".mp3")) found.push(path.slice(audioDir.length + 1));
  }
  return found.filter((path) => !AUDIO_CLIPS.some((clip) => clip.filename === path));
}

async function requestAudio(clip: Clip, key: string): Promise<Uint8Array> {
  const speech = clip.kind === "speech";
  const endpoint = speech
    ? `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(clip.request.voiceId)}`
    : "https://api.elevenlabs.io/v1/sound-generation";
  const body =
    clip.kind === "speech"
      ? {
          text: clip.request.text,
          model_id: clip.request.modelId,
          voice_settings: {
            stability: clip.request.voiceSettings.stability,
            similarity_boost: clip.request.voiceSettings.similarityBoost,
            style: clip.request.voiceSettings.style,
            use_speaker_boost: clip.request.voiceSettings.useSpeakerBoost,
          },
        }
      : {
          text: clip.request.text,
          model_id: clip.request.modelId,
          duration_seconds: clip.request.durationSeconds,
          prompt_influence: clip.request.promptInfluence,
          loop: clip.request.loop ?? false,
        };
  const url = `${endpoint}?output_format=${clip.request.outputFormat}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = "request rejected";
    try {
      const payload = (await response.json()) as { detail?: { status?: string; message?: string } };
      message = payload.detail?.message ?? payload.detail?.status ?? message;
    } catch {
      // A non-JSON error still has a useful HTTP status.
    }
    throw new Error(`ElevenLabs HTTP ${response.status}: ${message.replaceAll(key, "[redacted]")}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error(`ElevenLabs returned empty audio for ${clip.id}`);
  return bytes;
}

async function saveLock(lock: Lock): Promise<void> {
  const sorted = Object.fromEntries(Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(lockPath, `${JSON.stringify(sorted, null, 2)}\n`);
}

async function run(): Promise<void> {
  validateManifest();
  const [command, ...options] = process.argv.slice(2);
  const onlyIndex = options.indexOf("--only");
  const only = onlyIndex >= 0 ? options[onlyIndex + 1] : undefined;
  if (onlyIndex >= 0 && !only) throw new Error("--only needs an id prefix");
  const selected = AUDIO_CLIPS.filter((clip) => !only || clip.id.startsWith(only));
  if (selected.length === 0) throw new Error(`No clips match ${only}`);
  const lock = await readLock();

  if (command === "list") {
    for (const clip of selected) {
      console.log(`${(await stateOf(clip, lock)).padEnd(7)} ${clip.id} — ${clip.name}`);
    }
    return;
  }
  if (command === "verify") {
    let failed = false;
    for (const clip of selected) {
      const state = await stateOf(clip, lock);
      if (state !== "ready") {
        console.error(`${state}: ${clip.id}`);
        failed = true;
      }
    }
    for (const orphan of await orphanFiles()) {
      console.error(`orphan: ${orphan}`);
      failed = true;
    }
    if (failed) throw new Error("Audio verification failed");
    console.log(`Verified ${selected.length} audio clips`);
    return;
  }
  if (command === "prune") {
    if (!options.includes("--dry-run")) throw new Error("prune currently requires --dry-run");
    for (const orphan of await orphanFiles()) console.log(`orphan: ${orphan}`);
    return;
  }
  if (command === "generate") {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) throw new Error("Set ELEVENLABS_API_KEY to generate audio");
    const states = await Promise.all(selected.map((clip) => stateOf(clip, lock)));
    const stale = selected.find((_, index) => states[index] === "stale");
    if (stale && !options.includes("--replace")) {
      throw new Error(`${stale.id} is stale; listen before regenerating, then pass --replace`);
    }
    for (const [index, clip] of selected.entries()) {
      const state = states[index]!;
      if (state === "ready") {
        console.log(`ready: ${clip.id}`);
        continue;
      }
      console.log(`Generating ${clip.id}`);
      const bytes = await requestAudio(clip, key);
      const filename = join(audioDir, clip.filename);
      await mkdir(dirname(filename), { recursive: true });
      await writeFile(filename, bytes);
      lock[clip.id] = {
        requestHash: requestHash(clip),
        fileHash: sha256(bytes),
        bytes: bytes.length,
      };
      await saveLock(lock);
      console.log(`Saved ${clip.filename} (${bytes.length} bytes)`);
    }
    return;
  }
  throw new Error(
    "Usage: vpx scripts/audio.ts list | generate [--only prefix] [--replace] | verify | prune --dry-run",
  );
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
