# Features

What exists in the game today, and where to see it. Rooms open at `?room=<name>`, e.g. http://localhost:5173/?room=dev2

## Rooms

| Room | What it shows                                                                |
| ---- | ---------------------------------------------------------------------------- |
| dev0 | The church hall: stage, audience, the Speaker glancing around, house lights. |
| dev1 | One audience member on one chair, close up.                                  |
| dev2 | dev0 plus lighting states: house lights, or a spotlight (L to switch).       |
| dev3 | Playable church hall: crowd simulation, round timer and gambits (#6–#8).     |
| dev4 | Round timer.                                                                 |

## Engine

- **Objects and traits:** every object is a container; behaviour lives in traits. Traits can keep per-object state and be added or removed while the game runs.
- **Room registry:** rooms register by name; `?room=` picks one.
- **Pointer input:** hover and click go to the object under the mouse and bubble up to its parents; traits decide what happens.
- **Camera:** a per-room camera view with optional side-to-side sway.

## Characters

- **Paper rigs:** flat 2D characters built from SVG layers with swappable slots (arms, mouths, faces, hair...) and colour settings.
- **The Speaker:** front and back views sharing the same poses; ten arm poses and ten lip-sync mouth shapes. See the [contact sheet](https://danchambersanimation.github.io/shrew_farmer/contact-sheet.html).
- **Audience:** one generic seated rig. Looks and moods are generated from a seed; moods pick face and arms together.
- **Figures in 3D:** figures face the camera, sit in chairs (bent at hips and knees), turn from the waist with the head leading, glance around, cast outline-accurate shadows, and can be self-lit to stay readable in the dark.
- **Lip sync:** text is mapped to mouth shapes.

## Audience and gambits

- **Audience model:** each person has a personality and numeric state (approval, engagement); their face and arms follow their state while their appearance stays fixed.
- **Crowd simulation:** once a second, engagement drifts down and sociable people are pulled toward their neighbours' moods.
- **Gambits:** a registry of items and one effect pipeline for gambits, power-ups and equipment (see [gambits.md](gambits.md)). A round has a hand of gambits, each playable once.
- **Round timer:** a round clock with an on-screen meter.

## Lighting

- **Light groups and cues:** lights belong to groups; rooms define named states that set a level per group, and lights fade between them.
- **Spotlights:** a reusable shadow-casting spotlight prefab.

## Developer tools

- **Noclip (N):** fly the camera with WASD, R/F for up/down, the mouse to look and the wheel to zoom; C copies the camera settings.
- **Projection (Q):** switch between perspective and orthographic.
- **Lighting (L):** cycle a room's lighting states.
- **`window.world`:** the live scene, in dev builds, for the browser console.
