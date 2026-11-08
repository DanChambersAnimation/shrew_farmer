import { AUDIO_CLIPS } from "../audio/clips.ts";
import { playRecorded } from "../audio/player.ts";
import { effects, type RecordedAudioEffectDef } from "./registry.ts";

/** Every recorded sound effect is a named effect with its asset metadata. */
for (const clip of AUDIO_CLIPS) {
  if (clip.kind !== "effect") continue;
  const effect: RecordedAudioEffectDef = {
    id: clip.id,
    kind: "audio",
    name: clip.name,
    category: clip.category,
    purpose: clip.purpose,
    filename: clip.filename,
    caption: clip.caption,
    run() {
      playRecorded(clip.id);
    },
  };
  effects.register(effect.id, effect);
}
