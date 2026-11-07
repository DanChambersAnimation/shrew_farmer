# Design principles

## Systems over features

Every feature is built so it combines with other features, and is generally not a special case. New behaviour should come from combining general parts, not from one-off code.

## Objects have traits; traits have the behaviour

Everything in the world (rooms, audience members, the Speaker, props) is an object. Objects have no gameplay code of their own: behaviour lives in **traits** attached to them. Objects differ only by which traits they have and those traits' settings. An auditorium can be made to behave like a church hall; two audience members can differ only in their settings.

## Dev rooms and game rooms

- **Dev rooms** (`dev0`, `dev1`, ...) are numbered spaces for prototyping ideas.
- **Game rooms** (auditorium, green room, ...) combine what was proven in dev rooms.
- Every room is registered by name with a builder function. Features built in dev rooms must be reusable, not code that has to be copied.

## Content is type-safe code, editable by tools

All configuration (characters, rooms, gambits) stays in type-safe TypeScript, kept in a strict, predictable shape so a command-line tool can edit it and keep it consistent. Every content category should eventually be viewable as web pages and JSON, so the content can be audited and an LLM can read it without running the 3D engine.

## How the game looks and plays

- **2D characters in a 3D world.** Characters are flat paper cutouts in a 3D space.
- **Fixed point of view.** A three-quarter view, angled down from behind the Speaker (we see the back of his head), looking at the seated audience's faces.
- **Mouse-driven.** Hovering shows information; clicking chooses. What happens on hover or click is defined by traits, never per object.
