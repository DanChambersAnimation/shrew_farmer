# Shrew Farmer

A game about a motivational speaker climbing the professional speaking circuit by deploying conversational gambits. Flat 2D characters live in a 3D world, seen from a fixed point of view; play is mouse-driven (hover to inspect, click to act).

Built with [three.js](https://threejs.org), TypeScript and [Vite+](https://viteplus.dev) (`vp`).

## View it online (GitHub Pages)

Every push to `main` runs CI and, if it passes, publishes the latest build:

| Page          | URL                                                                    |
| ------------- | ---------------------------------------------------------------------- |
| Game (dev0)   | https://danchambersanimation.github.io/shrew_farmer/                   |
| Any room      | https://danchambersanimation.github.io/shrew_farmer/?room=dev0         |
| Contact sheet | https://danchambersanimation.github.io/shrew_farmer/contact-sheet.html |

Check the latest deploy under the repo's **Actions** tab (workflow **CI**, job **deploy**). Pages can take a minute to refresh after the job finishes.

## Run it locally

```sh
./dev.sh
```

This installs dependencies on first run, then starts the dev server with hot reload.
It listens on all network interfaces, so other devices on your LAN can open
`http://<your-computer's-LAN-IP>:5173/`. Vite prints the available network URLs
when it starts.

- Game: http://localhost:5173/ (pick a room with `?room=<name>`)
- Playable round: http://localhost:5173/?room=dev3 (press **Start Round** to begin with sound)
- Round timer demo: http://localhost:5173/?room=dev4
- T-shirt cannon demo: http://localhost:5173/?room=dev7
- All six gambit medals: http://localhost:5173/?room=dev8
- Contact sheet: http://localhost:5173/contact-sheet.html
- Audio samples: http://localhost:5173/audio-preview.html

Options: `PORT=3000 ./dev.sh` changes the port. Extra Vite arguments can be
passed to the script.

## Checks

```sh
vp check   # format, lint, type check
vp test    # unit tests
vp build   # production build into dist/
```

If `vp` isn't installed globally, use `./node_modules/.bin/vp`. CI runs all three on every push and pull request.

## Recorded audio clips

Open `http://localhost:5173/audio-preview.html` to search and listen to all 114 recorded cues:
Speaker lines, both outcomes for every gambit, round markers and endings, four audience voices
across eight moods, and crowd reactions and ambience. The files are committed under
`public/audio/`, with their metadata and offline generation requests in `src/audio/clips.ts`.
The gambit outcome sounds play in the game; the remaining cues are available for review while
the shared crowd and round audio scheduling is built.

```sh
vpx scripts/audio.ts list
vpx scripts/audio.ts verify
vpx scripts/audio.ts generate --only crowd/
```

Generation reads `ELEVENLABS_API_KEY` from the environment. Playback, builds, and CI do not need
the key. A changed request requires `generate --replace` to overwrite its previous recording.

## Design docs

Gambits, ideas, features and design principles are logged in [`doc`](doc/README.md).

## How the code is organised

The guiding rule is **systems over features**: new behavior should compose with what exists, not be a special case.

- `src/core/` – the engine: `GameObject` (a container with no behavior of its own), traits, the `World`, the room registry, and the pointer system.
- `src/traits/` – all behavior lives in traits attached to objects (`Shape`, `Light`, `Sign`, `Inspectable`, `Highlight`, ...). Objects differ only by which traits they have and those traits' settings.
- `src/rooms/` – one file per room; each registers itself by name. Dev rooms (`dev0`, `dev1`, ...) are for prototyping; game rooms combine what was proven there.
- `src/locations/` – reusable places (e.g. the church hall) described as object specs.
- `src/paper/` – the 2D "paper" character rig (layers + swappable slots) and text-to-mouth lip sync.
- `src/characters/` – character rigs, e.g. the Speaker.
