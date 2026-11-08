# Sound and speech — plan 1

Pre-recorded vocal responses and per-gambit sound effects, generated offline with
ElevenLabs and shipped as static files. Nothing calls ElevenLabs at runtime.

## Implementation status — 8 November 2026

The full proposed cue sheet has been recorded as 114 MP3s and indexed in
`src/audio/clips.ts`: six gambit success/failure pairs, an additional T-shirt launch,
round cues, Speaker lines, 59 mood lines across eight bands, eight situational audience
lines, and crowd reaction, clapping, snoring and room sounds. Every gambit verdict now
references its recorded effect. `/audio-preview.html` lets the team search and review
each take; `vpx scripts/audio.ts verify` checks the committed files and request hashes.

The other clips are content candidates. The shared mixer, round milestone events,
audience scheduler, cross-faded beds, captions and audio settings still need runtime
work, tracked in [#23](https://github.com/DanChambersAnimation/shrew_farmer/issues/23).

Related: [#15](https://github.com/DanChambersAnimation/shrew_farmer/issues/15) (game feedback),
[#16](https://github.com/DanChambersAnimation/shrew_farmer/issues/16) (staged beats),
[#17](https://github.com/DanChambersAnimation/shrew_farmer/issues/17) (round audio).
See also `doc/principles.md` — content is type-safe code, editable by tools.

## What already exists

- **`src/audio/cues.ts`** synthesises tones with the Web Audio API. No files, no network:
  `playCue` schedules oscillators. Today it covers `GET_READY`, `GAME_LOST` and the three
  Rule of Three beats (`ruleOfThreePitch`).
- **`src/traits/round-audio.ts`** fires those cues from round events: `ROUND_STARTED`,
  `ROUND_LOST` (emitted when a strict majority is disengaged at TIME).
- **Events worth hanging sound on** already exist:
  `GAMBIT_USED`, `GAMBIT_PLAYED`, `GAMBIT_REPLACED`, `CROWD_TICK`, `MOOD_CHANGED` (world event,
  with the audience member, the mood it left and the one it entered), `ROUND_STARTED`,
  `ROUND_LOST`, `GAME_TIMER_FINISHED`, `T_SHIRT_FIRED`, `CUE_CHANGED`.
- **Verdicts** already exist: `resolveItem` judges every move `success` or `failure`, so a
  gambit can sound different depending on whether it landed.

So the engine plumbing is in place. What is missing is **recorded voice and authored effects**,
and a way to keep them in sync with the code.

## Proposal

### 1. One manifest, generated content

A single TypeScript file, `src/audio/clips.ts`, is the source of truth for every recorded
asset. It stays type-safe code like the rest of the content, and a CLI generates and verifies
the files it describes.

```ts
export interface Clip {
  /** Stable id, also the path under public/audio minus the extension. */
  readonly id: string;
  readonly kind: "speech" | "effect";
  readonly name: string;
  readonly category: "speaker" | "gambit" | "crowd" | "round";
  readonly purpose: string;
  readonly filename: string;
  readonly caption: string;
  /** The exact text sent to the text-to-speech API. Speech only. */
  readonly text?: string;
  /** Voice settings for speech, sound-effect prompt for effects. */
  readonly request: SpeechRequest | EffectRequest;
  /** Where it is used, and by what event. For humans and the generator. */
  readonly usedBy: string;
}
```

The generator records each request hash and the generated file's content hash in
`src/audio/audio-lock.json`. Change one request and only that clip becomes stale. The CLI refuses
to overwrite a stale recording without `--replace`, so it can be heard before spending more
credits. The content hash also changes the browser URL when a new take uses the same request.

### 1a. Where the files go, and what they are called

Everything lives under **`public/audio/`**. `public/` is Vite's default static directory and
nothing overrides it (`vite.config.ts` sets no `publicDir`), so files there are copied verbatim
into `dist/`. The player builds URLs from `import.meta.env.BASE_URL` because GitHub Pages serves
the game under `/shrew_farmer/`; a literal `/audio/...` would point at the wrong site root.

**One directory per category.** The first path segment is the category, and it mirrors the four
things the game can make a sound about:

```
public/audio/
  speaker/          the Speaker's own lines
  gambit/           per-gambit sounds, one directory per gambit id
  crowd/            audience reactions: line bank, clapping, snoring
  round/            round structure: start, milestones, endings
```

**Naming inside each category.** Every file is named after the _event or state it belongs to_,
never after the recording (`nice-take-2.mp3` is how a project loses an afternoon). All lowercase,
words joined by hyphens, `.mp3` throughout.

| Category    | Path pattern                       | Examples                                                                                                                |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Speaker     | `speaker/<moment>.mp3`             | `speaker/round-start.mp3`, `speaker/round-won.mp3`, `speaker/round-lost.mp3`                                            |
| Gambit      | `gambit/<gambit-id>/<verdict>.mp3` | `gambit/personal-anecdote/success.mp3`, `gambit/praise-jesus/failure.mp3`                                               |
| Gambit      | `gambit/<gambit-id>/play.mp3`      | the act itself: `gambit/t-shirt-cannon/play.mp3`                                                                        |
| Crowd lines | `crowd/<mood>/<voice>-<line>.mp3`  | `crowd/bored/elderly-sigh.mp3`, `crowd/hostile/comic-boo.mp3`                                                           |
| Crowd beds  | `crowd/clap/<intensity>.mp3`       | `crowd/clap/few.mp3`, `crowd/clap/solid.mp3`, `crowd/clap/ovation.mp3`, `crowd/clap/dying.mp3`                          |
| Crowd beds  | `crowd/snore/<weight>.mp3`         | `crowd/snore/soft.mp3`, `crowd/snore/heavy.mp3`, `crowd/snore/snort.mp3`                                                |
| Round       | `round/<moment>.mp3`               | `round/start.mp3`, `round/quarter.mp3`, `round/half.mp3`, `round/three-quarters.mp3`, `round/won.mp3`, `round/lost.mp3` |

The gambit ids are exactly the registered ones — `personal-anecdote`, `anecdote-callback`,
`rule-of-three`, `pious-statement`, `praise-jesus`, `t-shirt-cannon` — so the directory name and
the code identity are the same string. If a gambit is renamed, the directory is renamed with it,
and the manifest hash catches the missing files.

**Two rules that save pain later:**

- **Ids, not sentences.** The filename carries the id, and the spoken text lives in the manifest.
  Editing a line must never mean renaming a file.
- **No spaces, no capitals, no version suffixes.** If a take is wrong, replace the file. Git
  remembers the old one, and the generator's request hash is what decides whether it is stale.

A manifest entry and its file line up without translation:

```ts
{
  id: "gambit/personal-anecdote/success",
  name: "Personal anecdote lands — rousing applause",
  category: "gambit",
  kind: "effect",
  purpose: "A sustained ovation when the anecdote raises approval.",
  filename: "gambit/personal-anecdote/success.mp3",
  caption: "The crowd breaks into sustained applause and cheers.",
  usedBy: "Personal Anecdote onSuccess",
  request: { text: "A small audience breaks into rousing applause…", modelId: "eleven_text_to_sound_v3" },
}
// -> public/audio/gambit/personal-anecdote/success.mp3
```

**Voice names are fixed and short** — `elderly`, `comic`, `rp`, `london`, `northern`, `scots`,
`irish`, `welsh`, `us`, `southern`, `aussie`, `south-asian`, `west-african` — and the same name is
used in the manifest, in the filename, and in whichever content file assigns a voice to an
audience member. One vocabulary everywhere.

### 2. A generator CLI

`scripts/audio.ts`, run with `vpx scripts/audio.ts` (the project's documented way to run
TypeScript). I would put this behind a new room trait's doc comment rather than scatter it.

```
vpx scripts/audio.ts list                  # what exists, what's stale, what's missing
vpx scripts/audio.ts generate             # all stale or missing clips
vpx scripts/audio.ts generate --only gambit/   # one area
vpx scripts/audio.ts verify               # CI: every manifest clip exists; no orphans
vpx scripts/audio.ts prune --dry-run      # files on disk that no clip claims
```

It reads `ELEVENLABS_API_KEY` from the environment. It must never print the key, and it writes
into `public/audio/` (Vite serves `public/` verbatim, and the build already copies it through).

Two hard rules:

- **Generated audio is committed.** The game ships static files; building the game must never
  need a key. A CI `verify` step catches a manifest entry that was added without generating.
- **The API is called offline only.** No runtime fetch, no key in the browser bundle.

### 3. Which voice, which effects

ElevenLabs' text-to-speech takes `voice_id`, `model_id` and `voice_settings`
(`stability`, `similarity_boost`, `style`, `use_speaker_boost`). Sound effects take a text
prompt plus `duration_seconds` (0.5–30), optional `prompt_influence`, and an explicit
`model_id: "eleven_text_to_sound_v3"`.

- **The Speaker** is one voice, used for all of his own lines. Pick it by ear once and pin the
  `voice_id` in the manifest; changing it later is a one-line edit plus regeneration.
- **The audience** should be several voices, not one. A crowd reacting in unison sounds fake.
  Plan for three or four, assigned per person from a seed so the same member keeps the same
  voice across replays. This is content, so it belongs in `src/characters/`, not in the audio
  module.

### 4. The cue sheet

Speech is the Speaker's material and the audience's reactions; effects are the gambits' own
sounds. Grouped by trigger:

**Round — start**

| Trigger         | Kind   | Content                                       |
| --------------- | ------ | --------------------------------------------- |
| `ROUND_STARTED` | speech | "Ladies and gentlemen, thank you for coming." |
| `ROUND_STARTED` | effect | room settles, chairs creak, a cough           |

**Round — progress milestones at 1/4, 1/2 and 3/4**

These are new triggers: nothing emits them yet, so they need a small trait that watches
`GameTimer.elapsedSeconds` and fires once per threshold (see "Milestones" below). They are
short stings, not speech — the meter already shows the time, so these are punctuation, not
information.

| Trigger                | Kind   | Content                                        |
| ---------------------- | ------ | ---------------------------------------------- |
| `quarter` (25%)        | effect | a single wooden tick, low urgency              |
| `half` (50%)           | effect | a two-note motif, warmer, "still going"        |
| `three-quarters` (75%) | effect | a rising three-note flourish, a little tension |

They should escalate in pitch and brightness across the round, so the player learns the shape
without looking at the meter. Keep them under a second: they sit under the Speaker.

**Round — finished, and it depends on how it went**

The end of a round has **two outcomes that must sound different**, which the game already
distinguishes: `ROUND_LOST` fires when a strict majority is disengaged at TIME
(`majorityDisengaged`, threshold 0.4), and otherwise the round simply ends on
`GAME_TIMER_FINISHED`.

| Trigger                          | Kind   | Content                                                   |
| -------------------------------- | ------ | --------------------------------------------------------- |
| `GAME_TIMER_FINISHED`, round won | speech | "That's my time — you've been wonderful."                 |
| `GAME_TIMER_FINISHED`, round won | effect | warm applause swelling, a few cheers, chairs              |
| `ROUND_LOST`                     | speech | "Well. Thank you for listening."                          |
| `ROUND_LOST`                     | effect | thin, scattered clapping that stops early, a single cough |

The difference should be obvious with the sound **alone**: dense and rising versus sparse and
dying away. A player looking away from the screen should know whether they held the room.

**Which verdict a "won" round needs is worth deciding.** `ROUND_LOST` answers "did I lose?" but
not "did I do well?". A round where the crowd merely stayed awake is not the same success as one
where they were ecstatic. I would add a second, positive test — average approval or engagement
above a threshold — so there are three endings, not two: **lost**, **survived**, **triumphed**,
each with its own pair of cues. That is cheap now and awkward to retrofit once clips are
recorded.

**Per gambit — success and failure variants**

Every gambit requires **two distinct recorded sound effects**: one for `onSuccess` and one for
`onFailure`. Both are entries in the effects registry with a name, category, intended purpose,
and filename. A physical action may also have an optional `onUse` sound, such as each T-shirt
launch. Speaker lines are separate speech clips. The first review set records only the Personal
Anecdote pair; the rest below are candidate sounds.

| Gambit              | Success effect                     | Failure effect                           |
| ------------------- | ---------------------------------- | ---------------------------------------- |
| `personal-anecdote` | sustained, building applause       | an awkward cough and chair creak         |
| `anecdote-callback` | a warm recognition chime           | a short, descending missed-cue chime     |
| `rule-of-three`     | a strong third beat and room cheer | a rhythm that stumbles and stops         |
| `pious-statement`   | a low, resolving organ swell       | a sour, unresolved organ note            |
| `praise-jesus`      | a full choir response              | a choir stab cut off in dissonance       |
| `t-shirt-cannon`    | excited whoops after the volley    | a dull impact and startled room reaction |

Failure variants should be shorter and flatter where that suits the gambit. The player should
hear the verdict from the sound alone.

**Moods and ambience** — see 4b. The line bank there covers every mood band, and clapping and
snoring are the ambience beds.

### 4a. Milestones — the one new trait this needs

Nothing emits progress events today, and adding three ad-hoc timer checks would be exactly the
special-casing `principles.md` warns about. Instead, a small room trait in the same shape as
`GameTimer`:

```ts
room.add(RoundMilestones, { at: [0.25, 0.5, 0.75] });
```

It watches `GameTimer.elapsedSeconds`, and on crossing each fraction emits one event
(`round-milestone` with the fraction and the round time) exactly once. `SoundCue` then maps
those events to clips like any other. It stays silent after TIME, and does nothing in a room
without a clock.

Two details worth getting right:

- **Fire on crossing, not on equality.** A frame can step past a threshold; compare
  `before < mark && after >= mark` rather than looking for an exact tick.
- **Support a restart.** Pausing and resuming is already possible through the clock's live
  settings, so keep the fired set in the trait's settings and clear it when `elapsedSeconds`
  goes backwards.

### 4b. Crowd reactions — voices, clapping and snoring

The audience's own noises are a third category, distinct from the Speaker's lines and the
gambits' effects. They are **layered beds and per-person stings**, not one-shots.

#### A line bank, not a catalogue

Isolated interjections are what make a crowd feel alive. They need **emotional direction**,
or a bare "So bored" comes out cheerful: ElevenLabs honours bracketed audio tags such as
`[bored]`, `[sighs]`, `[laughs]`, which direct the delivery instead of being spoken.

The game already has eight mood bands (`src/characters/mood.ts`), so the bank is grouped by
mood and the mood event decides which pool to draw from:

| Band         | Lines                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| `ecstatic`   | "He's amazing", "Oh my God!", "Yes!", "I love this guy", "[laughs] No way" |
| `delighted`  | "Wow", "Great", "Wonderful", "Ha! Good one", "More of that"                |
| `interested` | "Mm", "Go on", "Right...", "Interesting"                                   |
| `neutral`    | "Huh", "Okay", "Sure", "Hm", "Right then", "Fair enough"                   |
| `bored`      | "So bored", "How long is this?", "[sighs] Right", "Is it over yet?"        |
| `asleep`     | "[snores]", "...five more minutes", "[mumbles]"                            |
| `sceptical`  | "Really?", "Says who?", "I don't buy it", "Hmm. Right"                     |
| `hostile`    | "Boo!", "Get off!", "Rubbish!", "You what?", "[laughs] Oh dear"            |

Also worth having:

- **Pure non-verbal** — `[gasp]`, `[laughs]`, `[tuts]`, `[sighs]`, `[coughs]`, "ooh", "ahh".
  These carry more emotion than words and suit every voice.
- **Gambit-specific reactions**, which land far better than generic ones because they answer
  something: "Go on..." for an anecdote; "Oh! I remember" for a callback; counting along with
  the rule of three; "Amen" for a pious statement; "Catch!" for the t-shirt cannon.
- **Agreement and dissent between neighbours** — "Exactly!", "He's right", "No he isn't".
  These pair naturally with the influence `CrowdSimulation` already models.

**"WTF?" should become** "What the—?", "You what?" or "Are you serious?". Same shock, and it
keeps us clear of age ratings without a second censored recording pass later.

#### Voice roster

Ten to twelve voices, covering gender, age and accent: British RP, London, Northern English,
Scottish, Irish, Welsh, American general and Southern, Australian, South Asian, West African.
Include one **elderly** voice (nothing sells weary disapproval like it) and one **big comic**
voice for the extremes.

Do not record the full cross-product. Eight bands × six lines × ten voices is ~480 clips.
Assign each line to **two or three voices** and target ~60 clips for a first pass — variety
comes from the roster, not from every voice saying everything.

#### Clapping — a volume control

Clapping is the one crowd sound the player can already see: the audience rig has a `clap` arm
pose (approval ≥ 0.75, engagement ≥ 0.8). So it should track that state directly.

| Clip                 | Use                                                |
| -------------------- | -------------------------------------------------- |
| `crowd/clap/few`     | a handful of people, sparse and polite             |
| `crowd/clap/solid`   | a warm, full round                                 |
| `crowd/clap/ovation` | the room on its feet, whooping                     |
| `crowd/clap/dying`   | scattered, stopping early — the **lost round** cue |

The first three are an intensity ladder chosen by how many members are in a clapping state, and
cross-faded as that number changes. Nothing reports that count today, so the trait must derive it
the same way `RoundAudio` already counts disengaged people: walk the room for seated
`audience-member` objects and read their `AudienceModel` state. `dying` is a distinct one-shot for the round ending, so the
verdict applause never gets confused with the ambience.

#### Snoring — sparse and per-person

Tie it to the `asleep` band (`src/characters/mood.ts` puts engagement below 0.15 there, which the
face model already draws as closed eyes and a sleep bubble). **One sleeper is funny; twelve in sync is a kazoo orchestra**, so:
cap it to one or two voices at a time, stagger their starts, and leave long gaps.

- `crowd/snore/soft` — inhale, whistle, exhale
- `crowd/snore/heavy` — louder, for a room that has given up
- `crowd/snore/snort` — the wake-up startle, for someone re-engaging

#### Looping is the difficult part

ElevenLabs effects are good one-shots and unreliable loops; a badly looped snore clicks audibly
every cycle. Cross-fading two copies of a short generated clip is cheaper to iterate on than
prompting for a seamless loop, and the same machinery serves the clapping beds.

#### Never all at once

`CROWD_TICK` fires once a second, and `MOOD_CHANGED` fires per person. Neither is a suitable
trigger on its own: the crowd tick carries no per-person detail (only the tick number and round
time), and the mood event can fire for a dozen people in one frame. Without a limiter, forty
people would shout "Wow" in unison. The scheduler needs to allow **one or two voices per tick**,
refuse to repeat the same clip twice running, and mute a person's quips while they are snoring.

#### Mapping onto traits

Nothing here needs special-case code. `SoundCue` can carry a pool per mood band and pick from it
on `MOOD_CHANGED`, and a `CrowdAudio` trait can count the clapping and sleeping members once a
tick and drive the bed volumes. Both are settings, not new behaviour.

### 5. Playing it — a new trait, not special cases

The engine already says behaviour belongs in traits. So:

- **`src/audio/player.ts`** — a thin wrapper: fetch a clip, decode once, cache the buffer, play
  with an optional gain and pitch. Replaces the oscillator-only path for recorded sound; keeps
  `cues.ts` tone generation for anything still synthesised (the Rule of Three pitch ladder is
  lovely and cheap — keep it).
- **Gambit verdict effects** — the existing `onSuccess` and `onFailure` lists refer to the
  corresponding registered audio effects. `GAMBIT_PLAYED` happens before the verdict is known,
  so it cannot select the outcome sound.
- **`SoundCue` trait** — a later step maps non-gambit events to clip ids, so rooms and audience
  members can sound different through settings:

  ```ts
  room.add(SoundCue, {
    cues: { "round-lost": "speaker/round-lost" },
  });
  ```

  The crowd needs a shared scheduler so forty `MOOD_CHANGED` events do not play forty clips.

- **Autoplay**: browsers block audio until a gesture. The existing `Start Round` action is the
  natural unlock point — resume the `AudioContext` there and keep every cue silent before it.

### 6. Accessibility and taste

- **Sound needs its own opt-out.** `prefers-reduced-motion` covers the visuals; audio deserves a
  mute toggle (persisted) and a lower default volume. Strobing light already has a photosensitivity concern; loud sudden effects
  (cannon, choir stab) deserve a "reduce sudden sounds" option.
- **Every clip gets a caption.** The game already has speech bubbles; a spoken line should show
  its text too, which also gives you the transcript for free.
- **Never block play on audio.** Missing file, blocked context, decode failure: log once and
  continue silently.

## What I would build first

A thin vertical slice, not the whole cue sheet. Issue #21 contains the first review set:

1. `Clip` manifest plus `scripts/audio.ts` with `list`, `generate --only`, `verify`.
2. Six clips: one Speaker line, a success/failure effect pair, and three audience reactions.
3. `src/audio/player.ts` with decode and cache; wire the effect pair to the existing gambit
   verdict hooks and add a listening page with metadata.
4. Review the recordings before expanding the cue sheet.
5. Add a shared mixer, mute toggle, in-game captions, audience scheduling, and cross-faded beds
   after the sample sounds are approved.

That gets the pipeline proven end to end before anyone spends credits on forty clips they might
not like.

## Open questions

- **How much of the Speaker should be voiced?** Full lines make him a character; grunts and
  fragments keep him flexible and cheap. My instinct: full lines for the round openers and each
  gambit's success, silence otherwise.
- **Do audience voices need to be per-person?** If callbacks and moods already distinguish
  people, a shared pool of reactions may be enough.
- **Music or no music?** A loop under a sixty-second round is a strong flavour choice, and a
  roguelike wants variety. Out of scope here, but it competes for the same audio budget.
- **How rude can the crowd be?** "WTF?" versus "You what?" changes the age rating and the
  recording pass. Worth settling before the hostile lines are recorded.
- **Cache busting.** Files under `public/` get no hashed names, so a replaced clip can serve
  stale from a browser cache. The sample player appends `?v=<fileHash>` from the generated lock
  file. This changes even when a new take uses the same request.
