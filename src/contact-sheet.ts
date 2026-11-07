import "./contact-sheet.css";
import { ARM_POSES, MOUTHS, PALETTE, SPEAKER, SPEAKER_VIEWS } from "./characters/speaker.ts";
import { mouthsForText } from "./paper/lipsync.ts";
import { type RigSelection, renderRig } from "./paper/rig.ts";

const PHRASE = "You can do it!";

function tile(
  selection: RigSelection,
  caption: string,
  sub = "",
  view: string = SPEAKER_VIEWS.full,
) {
  return `<figure class="tile">${renderRig(SPEAKER, selection, view)}
    <figcaption><strong>${caption}</strong>${sub ? `<span>${sub}</span>` : ""}</figcaption></figure>`;
}

const heroes = [
  tile({}, "Idle"),
  tile({ armRight: "point", armLeft: "fistPump", mouth: "AI" }, "“You!”"),
  tile({ armRight: "wideOpen", armLeft: "wideOpen", mouth: "grin" }, "“Welcome!”"),
  tile({ armRight: "oneThing", armLeft: "rest", mouth: "O" }, "“One thing…”"),
];

const arms = Object.entries(ARM_POSES).map(([name, pose]) =>
  tile({ armRight: name }, pose.label, `${name} · ${pose.hand} hand`),
);

const mouths = Object.entries(MOUTHS).map(([name, m]) =>
  tile({ mouth: name }, name, m.sounds, SPEAKER_VIEWS.head),
);

const frames = mouthsForText(PHRASE, MOUTHS, { rest: "rest", fallback: "etc" });
const phrase = frames.map((f) =>
  tile({ mouth: f.mouth }, f.text.trim() || "␣", f.mouth, SPEAKER_VIEWS.head),
);

const swatches = Object.entries(PALETTE).map(
  ([name, color]) =>
    `<div class="swatch"><span style="background:${color}"></span><code>${name}</code><code>${color}</code></div>`,
);

document.querySelector<HTMLElement>("#sheet")!.innerHTML = `
  <header>
    <h1>The Speaker</h1>
    <p>Protagonist contact sheet. Chibi motivational speaker: slicked-back hair, sunglasses, shiny suit.
    A flat paper rig with three swappable slots (<code>armLeft</code>, <code>armRight</code>, <code>mouth</code>),
    any combination of which is valid.</p>
  </header>

  <section><h2>Key poses</h2><div class="grid hero">${heroes.join("")}</div></section>

  <section>
    <h2>Arm poses</h2>
    <p>Shown on the right arm. Every pose also works on the left arm (mirrored), and the two arms are independent.</p>
    <div class="grid">${arms.join("")}</div>
  </section>

  <section>
    <h2>Mouth shapes</h2>
    <p>Lip-sync shapes. Each lists the letters it covers; dialogue text is mapped to these automatically.</p>
    <div class="grid small">${mouths.join("")}</div>
  </section>

  <section>
    <h2>Text to mouths: “${PHRASE}”</h2>
    <div class="grid strip">${phrase.join("")}</div>
  </section>

  <section><h2>Palette</h2><div class="swatches">${swatches.join("")}</div></section>
`;
