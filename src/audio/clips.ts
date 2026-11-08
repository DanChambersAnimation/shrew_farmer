import { Registry } from "../core/registry.ts";

/** Recorded files are game content. The generator is the only code that calls ElevenLabs. */
interface ClipBase {
  /** Stable id and path under public/audio, without the extension. */
  readonly id: string;
  readonly name: string;
  readonly category: "speaker" | "gambit" | "crowd" | "round";
  readonly purpose: string;
  readonly filename: string;
  /** Spoken words or a concise description of a non-verbal sound. */
  readonly caption: string;
  readonly usedBy: string;
}

export interface SpeechClip extends ClipBase {
  readonly kind: "speech";
  readonly voiceName: string;
  readonly request: {
    readonly text: string;
    readonly voiceId: string;
    readonly modelId: string;
    readonly outputFormat: "mp3_44100_128";
    readonly voiceSettings: {
      readonly stability: number;
      readonly similarityBoost: number;
      readonly style: number;
      readonly useSpeakerBoost: boolean;
    };
  };
}

export interface SoundEffectClip extends ClipBase {
  readonly kind: "effect";
  readonly request: {
    readonly text: string;
    readonly modelId: "eleven_text_to_sound_v3";
    readonly outputFormat: "mp3_44100_128";
    readonly durationSeconds: number;
    readonly promptInfluence: number;
    readonly loop?: boolean;
  };
}

export type Clip = SpeechClip | SoundEffectClip;

/** First review set: the voice and prompts are provisional until heard in context. */
export const AUDIO_CLIPS: readonly Clip[] = [
  {
    id: "speaker/round-start",
    name: "Speaker opening",
    category: "speaker",
    kind: "speech",
    voiceName: "George",
    purpose: "Preview the Speaker's voice at the start of a round.",
    filename: "speaker/round-start.mp3",
    caption: "Ladies and gentlemen, thank you for coming.",
    usedBy: "Sample preview; candidate for ROUND_STARTED",
    request: {
      text: "Ladies and gentlemen, thank you for coming.",
      voiceId: "JBFqnCBsd6RMkjVDRZzb", // George, provisional
      modelId: "eleven_v4",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
      },
    },
  },
  {
    id: "gambit/personal-anecdote/success",
    name: "Personal anecdote lands — rousing applause",
    category: "gambit",
    kind: "effect",
    purpose: "A sustained, building ovation when the anecdote raises approval.",
    filename: "gambit/personal-anecdote/success.mp3",
    caption: "The crowd breaks into sustained, rising applause and cheers.",
    usedBy: "Personal Anecdote onSuccess",
    request: {
      text: "In a small church hall, a personal story lands beautifully. A seated audience breaks into enthusiastic applause that builds into a rousing cheer and sustains for several seconds. Natural hands clapping, warm room acoustics, no intelligible words, no music.",
      modelId: "eleven_text_to_sound_v3",
      outputFormat: "mp3_44100_128",
      durationSeconds: 4,
      promptInfluence: 0.5,
    },
  },
  {
    id: "gambit/personal-anecdote/failure",
    name: "Personal anecdote falls flat",
    category: "gambit",
    kind: "effect",
    purpose: "An awkward, brief room response when the anecdote fails.",
    filename: "gambit/personal-anecdote/failure.mp3",
    caption: "An awkward cough and a chair creak in the quiet room.",
    usedBy: "Personal Anecdote onFailure",
    request: {
      text: "In a small church hall, a speaker's personal anecdote falls flat. One awkward cough and a chair creak in a quiet seated audience. Short, dry, natural room sound. No intelligible words, no music.",
      modelId: "eleven_text_to_sound_v3",
      outputFormat: "mp3_44100_128",
      durationSeconds: 1.5,
      promptInfluence: 0.5,
    },
  },
  {
    id: "crowd/delighted/sarah-oh-remember",
    name: "Delighted audience — recognition",
    category: "crowd",
    kind: "speech",
    voiceName: "Sarah",
    purpose: "Preview a bright, positive audience reaction to a callback.",
    filename: "crowd/delighted/sarah-oh-remember.mp3",
    caption: "Oh! I remember!",
    usedBy: "Sample preview; candidate for a delighted MOOD_CHANGED reaction",
    request: {
      text: "[excited] Oh! I remember!",
      voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah, provisional default voice
      modelId: "eleven_v4",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.45,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
      },
    },
  },
  {
    id: "crowd/bored/charlie-is-it-over",
    name: "Bored audience — impatience",
    category: "crowd",
    kind: "speech",
    voiceName: "Charlie",
    purpose: "Preview a weary audience member losing patience.",
    filename: "crowd/bored/charlie-is-it-over.mp3",
    caption: "Is it over yet?",
    usedBy: "Sample preview; candidate for a bored MOOD_CHANGED reaction",
    request: {
      text: "[weary] Is it over yet?",
      voiceId: "IKne3meq5aSn9XLyUdCD", // Charlie, provisional default voice
      modelId: "eleven_v4",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.45,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
      },
    },
  },
  {
    id: "crowd/hostile/harry-rubbish",
    name: "Hostile audience — heckle",
    category: "crowd",
    kind: "speech",
    voiceName: "Harry",
    purpose: "Preview a short hostile heckle from the audience.",
    filename: "crowd/hostile/harry-rubbish.mp3",
    caption: "Rubbish!",
    usedBy: "Sample preview; candidate for a hostile MOOD_CHANGED reaction",
    request: {
      text: "[angry] Rubbish!",
      voiceId: "SOYHLrjzK2X1ezoPC6cr", // Harry, provisional default voice
      modelId: "eleven_v4",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.45,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
      },
    },
  },
];

export const clips = new Registry<Clip>("audio clip");
for (const clip of AUDIO_CLIPS) clips.register(clip.id, clip);
