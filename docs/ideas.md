# Ideas

Ideas not yet scheduled. Link a GitHub issue once something is ready to build.

## Audience

### Mood contagion

An audience member's traits are affected by their nearest neighbours when the neighbours' traits are strong enough (enthusiasm or boredom spreading along a row). It should be one general trait that works for any audience trait, with a radius, threshold and strength. Numeric audience state now exists, and the crowd simulation from #3 already pulls sociable people toward their neighbours' moods; what's left is the "only when strong enough" threshold, as one general trait.

### Hidden traits

Any audience member can secretly carry a trait (sleeper agent, heckler, journalist...) that an item's effect can wake. Surprises then combine freely instead of being scripted.

### Phone torches

At a big emotional moment, audience members hold up phone lights. A reward state driven by mood, spreading through neighbours.

## Rooms

### Dress the church hall

Props and decor for dev0. Issue [#4](https://github.com/DanChambersAnimation/shrew_farmer/issues/4).

### More rooms

Rooms are loosely defined and can be as different as an **auditorium**, an **elevator**, a **plane toilet** or a **broom cupboard**. Small or odd rooms mean seats should generalise to "audience spots" (standing or seated), and the camera framing must work in tight spaces. Issue [#4](https://github.com/DanChambersAnimation/shrew_farmer/issues/4).

### Room hazards and practical lights

A flickering fluorescent tube, candles (fire risk), emergency exit signs glowing in the dark, lightning outside the windows.

## Tools

### Content catalog

Every content category (rooms, characters, audience, gambits...) browsable as web pages and JSON, for auditing content and so an LLM can read it without the 3D engine.

### Content editing tool

A command-line tool that edits the type-safe content files (via code transforms) and checks they follow the content pattern.

## Rendering

### Bloom and particles

Needed to make sparks, beams, flashes and fireworks look bright rather than flat.

### Separate head turn

At the moment the Speaker's head turns with his shoulders. A separately animated head would allow more expressive looks.
