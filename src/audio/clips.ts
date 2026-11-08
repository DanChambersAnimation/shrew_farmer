import { Registry } from "../core/registry.ts";
import type { Mood } from "../characters/mood.ts";

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

type SoundSpec = readonly [
  id: string,
  name: string,
  purpose: string,
  prompt: string,
  caption: string,
  seconds: number,
  loop?: boolean,
];

function sound([id, name, purpose, prompt, caption, seconds, loop]: SoundSpec): SoundEffectClip {
  return {
    id,
    name,
    category: id.split("/")[0] as ClipBase["category"],
    kind: "effect",
    purpose,
    filename: `${id}.mp3`,
    caption,
    usedBy: `Candidate sound for ${id}`,
    request: {
      text: prompt,
      modelId: "eleven_text_to_sound_v3",
      outputFormat: "mp3_44100_128",
      durationSeconds: seconds,
      promptInfluence: 0.5,
      ...(loop ? { loop: true } : {}),
    },
  };
}

const SOUND_SPECS = [
  [
    "gambit/anecdote-callback/success",
    "Callback lands",
    "Recognition after a remembered story",
    "A soft, warm recognition chime rising gently, then a small delighted audience murmur in a church hall. Short one-shot, no speech, no music bed.",
    "A warm chime and delighted murmur.",
    2,
  ],
  [
    "gambit/anecdote-callback/failure",
    "Callback misses",
    "A callback that the room does not recognise",
    "A short recognition chime goes flat and descends, followed by an awkward quiet pause in a small hall. Dry and understated, no speech.",
    "A chime falls flat in an awkward silence.",
    1.5,
  ],
  [
    "gambit/rule-of-three/success",
    "Rule of three lands",
    "The third beat completes the rhythm",
    "A strong third hand-drum beat completes a rising three-part rhythm; a small audience responds with a cheerful burst. One clear final impact, no speech, no music bed.",
    "The third beat lands and the room cheers.",
    2.5,
  ],
  [
    "gambit/rule-of-three/failure",
    "Rule of three stumbles",
    "The third beat fails to move the room",
    "A three-part hand-drum rhythm stumbles on its final beat, losing energy and stopping abruptly in a quiet hall. Short, comic but subtle, no speech.",
    "The rhythm stumbles and stops.",
    1.5,
  ],
  [
    "gambit/pious-statement/success",
    "Pious statement lands",
    "A sincere religious appeal is welcomed",
    "A low church organ chord swells and resolves warmly; a few people murmur approval in a small hall. Solemn and brief, no words, no music bed.",
    "An organ chord resolves under a warm murmur.",
    2.5,
  ],
  [
    "gambit/pious-statement/failure",
    "Pious statement falters",
    "A religious appeal meets resistance",
    "A low church organ chord bends into a sour unresolved note, then a polite cough in a quiet hall. Short and restrained, no words.",
    "An organ note turns sour and someone coughs.",
    1.5,
  ],
  [
    "gambit/praise-jesus/success",
    "Praise Jesus lands",
    "A bold faith appeal excites its listeners",
    "A bright gospel choir chord answers a speaker in a small church hall, with a little clapping and joy. Rousing short one-shot, no intelligible lyrics, no music bed.",
    "A bright choir response and clapping.",
    3,
  ],
  [
    "gambit/praise-jesus/failure",
    "Praise Jesus divides the room",
    "A bold faith appeal goes badly",
    "A short gospel choir stab turns dissonant and cuts off; a few listeners groan in a small hall. Comic, abrupt, no intelligible words.",
    "The choir cuts off as listeners groan.",
    1.5,
  ],
  [
    "gambit/t-shirt-cannon/success",
    "T-shirt cannon delights",
    "An engaged crowd enjoys the volley",
    "Three T-shirts have just landed safely in a small audience. Excited whoops, scattered laughter and enthusiastic handclaps rise briefly. No intelligible words, no music.",
    "The audience whoops and applauds the volley.",
    3,
  ],
  [
    "gambit/t-shirt-cannon/failure",
    "T-shirt cannon injury",
    "A cannon shot hits a disengaged audience member badly",
    "A dull cloth impact, a startled gasp, then an uneasy hush across a small audience. Brief and unmistakably wrong, no intelligible words, no music.",
    "A dull impact is followed by a startled gasp.",
    2,
  ],
  [
    "gambit/t-shirt-cannon/play",
    "T-shirt launch",
    "The physical sound of one shirt leaving the cannon",
    "A toy T-shirt cannon fires one soft but punchy whomp with a short rush of air and fabric flutter. One clean launch, no crowd reaction, no speech.",
    "The T-shirt cannon fires with a whomp.",
    0.8,
  ],
  [
    "round/start",
    "Room settles",
    "The audience settles when the round begins",
    "A small church hall audience settles into their chairs: several chair creaks, a rustle, one quiet cough and a hush. Natural room tone, no intelligible words, no music.",
    "Chairs creak and the room settles.",
    3,
  ],
  [
    "round/quarter",
    "Quarter-round tick",
    "Mark the first quarter of a round",
    "One dry wooden clock tick, low urgency, with a tiny room resonance. A single short one-shot, no speech, no music.",
    "A wooden tick marks the quarter point.",
    0.6,
  ],
  [
    "round/half",
    "Half-round motif",
    "Mark the midpoint of a round",
    "A warm, clear two-note mallet motif with a little lift, as if the show is still going. Under one second, no speech, no bed.",
    "A two-note motif marks halfway.",
    0.9,
  ],
  [
    "round/three-quarters",
    "Three-quarter flourish",
    "Raise urgency near the end of a round",
    "A rising three-note wooden mallet flourish, a little brighter and more urgent than the earlier clock cues. Under one second, no speech, no bed.",
    "A rising flourish marks three quarters.",
    0.9,
  ],
  [
    "round/won",
    "Round won",
    "Make a successful ending obvious by sound",
    "Warm applause in a small church hall swells into cheers and a few chairs moving as people rise. Positive, dense, natural, no intelligible words, no music.",
    "The room applauds and cheers warmly.",
    4,
  ],
  [
    "round/lost",
    "Round lost",
    "Make an unsuccessful ending obvious by sound",
    "Thin, scattered polite claps in a small church hall fade away too early; one awkward cough remains. Sparse and deflated, no intelligible words, no music.",
    "Sparse clapping dies away after a cough.",
    2.5,
  ],
  [
    "crowd/ambience/bed",
    "Church hall audience bed",
    "Quiet continuous room atmosphere under speech",
    "Low, diffuse presence of seated people in a small church hall: tiny cloth rustles, chairs shifting, distant breathing and barely audible murmurs, no intelligible words, no music. Even texture suitable for a loop.",
    "A low bed of audience rustles and murmurs.",
    12,
    true,
  ],
  [
    "crowd/settles",
    "Crowd settles",
    "A discrete settling reaction",
    "A few seated people shuffle and quieten, chairs creaking softly in a small church hall. Short one-shot, no speech.",
    "The crowd shuffles and settles.",
    2,
  ],
  [
    "crowd/laughs",
    "Crowd laughs",
    "A brief shared laugh after a good line",
    "A small church hall audience gives a natural, brief shared laugh, several distinct people rather than one canned laugh. No intelligible words, no music.",
    "Several audience members laugh.",
    2,
  ],
  [
    "crowd/murmurs",
    "Crowd murmurs",
    "A low collective reaction",
    "A small church hall audience murmurs among themselves in a low wave, interested but with no intelligible words. Brief natural one-shot, no music.",
    "A low murmur passes through the crowd.",
    2,
  ],
  [
    "crowd/clap/few",
    "A few clappers",
    "Lowest live applause level",
    "Only a handful of seated people clap sparsely and politely in a small church hall. Natural uneven handclaps, low energy, no cheering, no words.",
    "A few people clap politely.",
    3,
    true,
  ],
  [
    "crowd/clap/solid",
    "Solid applause",
    "Middle live applause level",
    "A small church hall audience gives warm, steady applause with many hands but no whooping. Natural uneven clapping, consistent energy, no words.",
    "The audience applauds steadily.",
    4,
    true,
  ],
  [
    "crowd/clap/ovation",
    "Ovation",
    "Highest live applause level",
    "A small church hall audience gives a full standing ovation with vigorous layered handclaps, whoops and chairs rising. Joyous sustained energy, no intelligible words.",
    "The room rises in a cheering ovation.",
    5,
    true,
  ],
  [
    "crowd/clap/dying",
    "Dying applause",
    "A failed round's polite clapping",
    "A few scattered handclaps in a small church hall stop awkwardly after a second; one cough and silence. A single ending sting, no speech.",
    "Scattered applause fades out too soon.",
    2.5,
  ],
  [
    "crowd/snore/soft",
    "Soft snore",
    "One sleeping audience member",
    "One seated person gives a small comic sleeping snore: soft inhale, tiny whistle, exhale. Isolated and natural, no words, no other sounds.",
    "A person snores softly.",
    2.5,
  ],
  [
    "crowd/snore/heavy",
    "Heavy snore",
    "A louder sleeping audience member",
    "One seated person gives a loud, comic but believable snore: rough inhale, nasal whistle and long exhale. Isolated, no words, no other sounds.",
    "A person snores heavily.",
    3,
  ],
  [
    "crowd/snore/snort",
    "Wake-up snort",
    "A sleeping audience member startles awake",
    "One sleepy person abruptly snorts awake with a sharp nasal gasp and tiny chair creak. Very short isolated one-shot, no words.",
    "A sleeper snorts awake.",
    0.8,
  ],
  [
    "crowd/reaction/gasp",
    "Audience gasp",
    "A small surprise reaction",
    "One seated audience member gives a brief surprised gasp in a quiet church hall. Isolated human sound, no words, no music.",
    "Someone gasps.",
    0.8,
  ],
  [
    "crowd/reaction/laugh",
    "Audience laugh",
    "An isolated laugh",
    "One seated audience member gives a short genuine chuckle, close but natural. No words, no other sounds.",
    "Someone chuckles.",
    1,
  ],
  [
    "crowd/reaction/tut",
    "Audience tut",
    "A quiet sign of disapproval",
    "One person makes a distinct disapproving tongue click or tut in a quiet hall. Isolated, very short, no words.",
    "Someone tuts disapprovingly.",
    0.8,
  ],
  [
    "crowd/reaction/sigh",
    "Audience sigh",
    "A quiet sign of weariness",
    "One person exhales a long weary sigh while seated in a quiet hall. Isolated, no words, no music.",
    "Someone sighs.",
    1.2,
  ],
  [
    "crowd/reaction/cough",
    "Audience cough",
    "A small awkward interruption",
    "One dry human cough in a quiet church hall, close and brief, no words or other sounds.",
    "Someone coughs.",
    0.8,
  ],
  [
    "crowd/reaction/ooh",
    "Audience ooh",
    "A short pleased surprise",
    "Several seated people make a soft synchronized ooh of pleasant surprise, no intelligible words, no music.",
    "The audience gives a soft ooh.",
    1,
  ],
  [
    "crowd/reaction/ahh",
    "Audience ahh",
    "A short understanding reaction",
    "Several seated people make a gentle ahh of recognition and understanding, no intelligible words, no music.",
    "The audience gives an understanding ahh.",
    1,
  ],
] as const satisfies readonly SoundSpec[];

const EXPANDED_SOUNDS: readonly SoundEffectClip[] = SOUND_SPECS.map(sound);

const VOICES = {
  George: "JBFqnCBsd6RMkjVDRZzb",
  Sarah: "EXAVITQu4vr4xnSDxMaL",
  Charlie: "IKne3meq5aSn9XLyUdCD",
  Harry: "SOYHLrjzK2X1ezoPC6cr",
  Matilda: "XrExE9yKIg1WjnnlVkGX",
} as const;

type Voice = keyof typeof VOICES;
type SpeechSpec = readonly [id: string, name: string, text: string, voice: Voice, purpose: string];

function speech([id, name, words, voice, purpose]: SpeechSpec): SpeechClip {
  return {
    id,
    name,
    category: id.split("/")[0] as ClipBase["category"],
    kind: "speech",
    voiceName: voice,
    purpose,
    filename: `${id}.mp3`,
    caption: words.replace(/\[[^\]]+\]\s*/g, "").trim() || "A brief vocal reaction.",
    usedBy: id.startsWith("crowd/")
      ? "Candidate for the audience reaction pool"
      : "Candidate Speaker cue",
    request: {
      text: words,
      voiceId: VOICES[voice],
      modelId: "eleven_v4",
      outputFormat: "mp3_44100_128",
      voiceSettings: {
        stability: 0.45,
        similarityBoost: 0.75,
        style: 0,
        useSpeakerBoost: true,
      },
    },
  };
}

const SPEAKER_SPECS = [
  [
    "speaker/round-won",
    "Speaker — round won",
    "That's my time — you've been wonderful.",
    "George",
    "A warm sign-off after keeping the room",
  ],
  [
    "speaker/round-lost",
    "Speaker — round lost",
    "Well. Thank you for listening.",
    "George",
    "A deflated sign-off after losing the room",
  ],
  [
    "speaker/personal-anecdote",
    "Speaker — personal anecdote",
    "So there I was, forty feet up a ladder…",
    "George",
    "A fragment of the Speaker's personal story",
  ],
  [
    "speaker/anecdote-callback",
    "Speaker — anecdote callback",
    "Remember the ladder? Exactly. That's what this is.",
    "George",
    "Bring the audience back to the earlier story",
  ],
  [
    "speaker/rule-of-three",
    "Speaker — rule of three",
    "Simple. Honest. Unstoppable.",
    "George",
    "Three rhythmic beats of rhetoric",
  ],
  [
    "speaker/pious-statement",
    "Speaker — pious statement",
    "There are things we don't earn. We accept them.",
    "George",
    "A sincere religious appeal",
  ],
  [
    "speaker/praise-jesus",
    "Speaker — praise Jesus",
    "Praise Jesus! Amen!",
    "George",
    "An exuberant religious declaration",
  ],
  [
    "speaker/t-shirt-cannon",
    "Speaker — T-shirt cannon",
    "Catch it! Don't be shy!",
    "George",
    "Shout during the T-shirt volley",
  ],
  [
    "speaker/gambit-failure",
    "Speaker — missed gambit",
    "Right. Moving on.",
    "George",
    "A recovery line after a failed gambit",
  ],
] as const satisfies readonly SpeechSpec[];

type CrowdSpec = readonly [mood: Mood, voice: Exclude<Voice, "George">, slug: string, text: string];
const CROWD_SPECS = [
  ["ecstatic", "Sarah", "hes-amazing", "[excited] He's amazing!"],
  ["ecstatic", "Charlie", "oh-my-god", "[excited] Oh my God!"],
  ["ecstatic", "Harry", "yes", "[cheering] Yes!"],
  ["ecstatic", "Matilda", "love-this-guy", "[excited] I love this guy!"],
  ["ecstatic", "Sarah", "no-way", "[laughs] No way!"],
  ["ecstatic", "Charlie", "brilliant", "[cheering] Brilliant!"],
  ["ecstatic", "Matilda", "keep-going", "[excited] Keep going!"],
  ["delighted", "Sarah", "wow", "[delighted] Wow!"],
  ["delighted", "Charlie", "great", "[pleased] Great!"],
  ["delighted", "Matilda", "wonderful", "[warmly] Wonderful."],
  ["delighted", "Harry", "good-one", "[laughs] Ha! Good one."],
  ["delighted", "Sarah", "more-of-that", "[pleased] More of that!"],
  ["delighted", "Charlie", "thats-lovely", "[warmly] That's lovely."],
  ["delighted", "Matilda", "well-done", "[pleased] Well done."],
  ["interested", "Charlie", "mm", "[thoughtful] Mm."],
  ["interested", "Sarah", "go-on", "[curious] Go on..."],
  ["interested", "Harry", "right", "[interested] Right..."],
  ["interested", "Matilda", "interesting", "[thoughtful] Interesting."],
  ["interested", "Sarah", "and-then", "[curious] And then?"],
  ["interested", "Charlie", "im-listening", "[interested] I'm listening."],
  ["interested", "Matilda", "tell-us-more", "[curious] Tell us more."],
  ["neutral", "Charlie", "huh", "[neutral] Huh."],
  ["neutral", "Sarah", "okay", "[neutral] Okay."],
  ["neutral", "Harry", "sure", "[neutral] Sure."],
  ["neutral", "Matilda", "hm", "[thoughtful] Hm."],
  ["neutral", "Charlie", "right-then", "[neutral] Right then."],
  ["neutral", "Sarah", "fair-enough", "[neutral] Fair enough."],
  ["neutral", "Matilda", "i-see", "[neutral] I see."],
  ["bored", "Charlie", "so-bored", "[bored] So bored."],
  ["bored", "Matilda", "how-long", "[weary] How long is this?"],
  ["bored", "Sarah", "sigh-right", "[sighs] Right."],
  ["bored", "Harry", "when-dinner", "[bored] When's dinner?"],
  ["bored", "Matilda", "still-going", "[weary] Is he still going?"],
  ["bored", "Sarah", "need-a-break", "[tired] I need a break."],
  ["bored", "Charlie", "lost-track", "[bored] I lost track."],
  ["asleep", "Charlie", "five-more-minutes", "[sleepily] Five more minutes..."],
  ["asleep", "Matilda", "mumbles", "[mumbles] Hmm... what?"],
  ["asleep", "Harry", "wasnt-sleeping", "[startled] I wasn't sleeping!"],
  ["asleep", "Sarah", "nearly-awake", "[sleepily] I'm nearly awake..."],
  ["asleep", "Charlie", "dreaming", "[mumbles] Just dreaming..."],
  ["asleep", "Matilda", "leave-me", "[sleepily] Leave me here..."],
  ["asleep", "Harry", "snore-awake", "[startled] What did I miss?"],
  ["sceptical", "Harry", "really", "[skeptical] Really?"],
  ["sceptical", "Sarah", "says-who", "[skeptical] Says who?"],
  ["sceptical", "Charlie", "dont-buy-it", "[skeptical] I don't buy it."],
  ["sceptical", "Matilda", "hmm-right", "[skeptical] Hmm. Right."],
  ["sceptical", "Harry", "prove-it", "[skeptical] Prove it."],
  ["sceptical", "Sarah", "are-you-sure", "[skeptical] Are you sure?"],
  ["sceptical", "Matilda", "bit-convenient", "[skeptical] That's a bit convenient."],
  ["hostile", "Harry", "boo", "[angry] Boo!"],
  ["hostile", "Charlie", "get-off", "[angry] Get off!"],
  ["hostile", "Sarah", "you-what", "[angry] You what?"],
  ["hostile", "Matilda", "oh-dear", "[sarcastic laugh] Oh dear."],
  ["hostile", "Harry", "nonsense", "[angry] Nonsense!"],
  ["hostile", "Charlie", "not-listening", "[angry] I'm not listening to this!"],
  ["hostile", "Matilda", "what-the", "[shocked] What the—?"],
] as const satisfies readonly CrowdSpec[];

const GAMBIT_REACTION_SPECS = [
  [
    "crowd/reaction/sarah-remember",
    "Audience — callback recognised",
    "[delighted] Oh, I remember!",
    "Sarah",
    "A positive callback reaction",
  ],
  [
    "crowd/reaction/charlie-counting",
    "Audience — counting along",
    "[playful] One... two... three!",
    "Charlie",
    "Count along with the rule of three",
  ],
  [
    "crowd/reaction/matilda-amen",
    "Audience — amen",
    "[warmly] Amen.",
    "Matilda",
    "Religious agreement",
  ],
  [
    "crowd/reaction/harry-catch",
    "Audience — catch",
    "[excited] Catch!",
    "Harry",
    "A shout during the T-shirt volley",
  ],
  [
    "crowd/reaction/sarah-exactly",
    "Audience — exactly",
    "[agreeing] Exactly!",
    "Sarah",
    "Neighbour agreement",
  ],
  [
    "crowd/reaction/charlie-hes-right",
    "Audience — he's right",
    "[agreeing] He's right.",
    "Charlie",
    "Neighbour agreement",
  ],
  [
    "crowd/reaction/harry-no-he-isnt",
    "Audience — dissent",
    "[annoyed] No he isn't.",
    "Harry",
    "Neighbour dissent",
  ],
  [
    "crowd/reaction/matilda-seriously",
    "Audience — seriously",
    "[shocked] Are you serious?",
    "Matilda",
    "A gambit that goes badly",
  ],
] as const satisfies readonly SpeechSpec[];

const EXPANDED_SPEECH: readonly SpeechClip[] = [
  ...SPEAKER_SPECS.map(speech),
  ...CROWD_SPECS.map(([mood, voice, slug, words]) =>
    speech([
      `crowd/${mood}/${voice.toLowerCase()}-${slug}`,
      `${mood[0]!.toUpperCase()}${mood.slice(1)} audience — ${slug.replaceAll("-", " ")}`,
      words,
      voice,
      `A ${mood} audience member reacts to the Speaker`,
    ]),
  ),
  ...GAMBIT_REACTION_SPECS.map(speech),
];

/** Recorded content for every planned cue. Runtime use is wired independently. */
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
  ...EXPANDED_SOUNDS,
  ...EXPANDED_SPEECH,
];

export const clips = new Registry<Clip>("audio clip");
for (const clip of AUDIO_CLIPS) clips.register(clip.id, clip);
