import { variants } from "../paper/limbs.ts";
import type { Rig } from "../paper/rig.ts";
import { rigs } from "../paper/rig-registry.ts";
import type { Mood } from "./mood.ts";

/*
 * Speech bubbles as a paper rig: a frame (how the feeling comes out) and a
 * glyph (what the feeling is). Canvas 200 x 170; the tail's tip is TAIL_TIP.
 */

export const TAIL_TIP: [number, number] = [56, 166];

const INK = "#2b1d14";
const LINE = `stroke="${INK}" stroke-width="6" stroke-linejoin="round"`;
const PAPER = `fill="#ffffff" ${LINE}`;

/** Frames: said aloud, thought privately, or an outburst. */
const FRAMES = {
  speech: `<rect x="12" y="10" width="176" height="118" rx="46" ${PAPER}/><path d="M 50 122 L 56 166 L 86 124" ${PAPER}/><rect x="40" y="110" width="56" height="16" fill="#ffffff"/>`,
  thought: `<g ${PAPER}>${[
    [100, 70, 62, 48],
    [52, 66, 36, 32],
    [148, 66, 36, 32],
    [76, 34, 34, 26],
    [124, 32, 34, 26],
    [100, 104, 44, 26],
  ]
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)
    .join("")}</g><g fill="#ffffff">${[
    [100, 70, 58, 44],
    [52, 66, 32, 28],
    [148, 66, 32, 28],
    [76, 34, 30, 22],
    [124, 32, 30, 22],
    [100, 104, 40, 22],
  ]
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`)
    .join(
      "",
    )}</g><circle cx="66" cy="140" r="9" ${PAPER}/><circle cx="56" cy="160" r="5" ${PAPER}/>`,
  burst: `<path d="M 100 4 L 118 38 L 158 16 L 150 54 L 194 62 L 160 84 L 188 116 L 146 112 L 140 148 L 108 120 L 56 166 L 74 120 L 30 132 L 46 98 L 6 82 L 44 62 L 22 26 L 66 38 Z" ${PAPER}/>`,
} as const;

const text = (s: string, size: number, color: string) =>
  `<text x="100" y="${70 + size * 0.35}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${size}" fill="${color}">${s}</text>`;
const heart = (x: number, y: number, k: number) =>
  `<path transform="translate(${x} ${y}) scale(${k})" d="M 0 12 C -22 -6 -12 -26 0 -12 C 12 -26 22 -6 0 12 Z" fill="#e0245e" stroke="${INK}" stroke-width="${3 / k}"/>`;

/** Glyphs, drawn around the bubble's centre (100, 70). */
const GLYPHS = {
  hearts: heart(100, 72, 1.6) + heart(64, 60, 0.9) + heart(136, 58, 0.9),
  heart: heart(100, 72, 1.8),
  stars: `<path d="M 100 30 L 110 62 L 142 70 L 110 78 L 100 110 L 90 78 L 58 70 L 90 62 Z" fill="#f5b800" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M 150 36 L 154 48 L 166 52 L 154 56 L 150 68 L 146 56 L 134 52 L 146 48 Z" fill="#f5b800"/>`,
  grin: `<circle cx="100" cy="70" r="38" fill="#ffd34d" stroke="${INK}" stroke-width="5"/><circle cx="86" cy="60" r="5" fill="${INK}"/><circle cx="114" cy="60" r="5" fill="${INK}"/><path d="M 78 76 Q 100 100 122 76 Z" fill="${INK}"/>`,
  haha: text("HA!", 50, "#d62828"),
  lightbulb: `<path d="M 100 30 C 76 30 68 52 76 68 C 82 80 88 82 88 92 L 112 92 C 112 82 118 80 124 68 C 132 52 124 30 100 30 Z" fill="#ffe066" stroke="${INK}" stroke-width="5"/><rect x="88" y="94" width="24" height="12" rx="3" fill="#9aa0a6" stroke="${INK}" stroke-width="4"/><path d="M 60 34 L 70 42 M 140 34 L 130 42 M 100 14 L 100 22" stroke="#f5b800" stroke-width="5" stroke-linecap="round"/>`,
  question: text("?", 74, "#1d4ed8"),
  dots: text("···", 64, "#7a7a7a"),
  clock: `<circle cx="100" cy="70" r="36" fill="#ffffff" stroke="#5b6c8f" stroke-width="7"/><path d="M 100 70 L 100 46 M 100 70 L 118 80" stroke="#5b6c8f" stroke-width="6" stroke-linecap="round"/>`,
  phone: `<rect x="80" y="30" width="40" height="76" rx="7" fill="#2b2b33" stroke="${INK}" stroke-width="4"/><rect x="86" y="38" width="28" height="54" rx="2" fill="#7fc8ff"/>`,
  zzz: text("Zzz", 46, "#6b4fa0"),
  hmm: text("hmm", 44, "#5b6c8f"),
  interrobang: text("?!", 62, "#7a3fbf"),
  exclaim: text("!", 80, "#d62828"),
  grawlix: text("#@$%!", 40, "#8b1a1a"),
  storm: `<path d="M 64 70 C 52 70 50 50 66 48 C 68 32 92 28 100 42 C 110 30 136 36 134 54 C 150 56 148 76 132 76 Z" fill="#6b7280" stroke="${INK}" stroke-width="4"/><path d="M 102 78 L 90 102 L 104 100 L 96 124 L 120 92 L 106 94 L 114 78 Z" fill="#f5b800" stroke="${INK}" stroke-width="3"/>`,
} as const;

export type BubbleFrame = keyof typeof FRAMES;
export type BubbleGlyph = keyof typeof GLYPHS;

export const SPEECH_BUBBLE: Rig = {
  width: 200,
  height: 170,
  layers: [
    { slot: "frame", variants: variants(FRAMES, (svg) => svg), defaultVariant: "speech" },
    { slot: "glyph", variants: variants(GLYPHS, (svg) => svg), defaultVariant: "dots" },
  ],
};

rigs.register("speech-bubble", SPEECH_BUBBLE);

/**
 * How each mood shows: the bubble's frame (said aloud, thought, or an outburst)
 * and the glyphs it may use. Data, so it can be tuned without touching code.
 */
export const MOOD_BUBBLES: Record<Mood, { frame: BubbleFrame; glyphs: readonly BubbleGlyph[] }> = {
  ecstatic: { frame: "burst", glyphs: ["hearts", "stars"] },
  delighted: { frame: "speech", glyphs: ["haha", "grin", "heart"] },
  interested: { frame: "thought", glyphs: ["lightbulb", "question"] },
  neutral: { frame: "thought", glyphs: ["dots"] },
  bored: { frame: "thought", glyphs: ["clock", "phone"] },
  asleep: { frame: "thought", glyphs: ["zzz"] },
  sceptical: { frame: "thought", glyphs: ["hmm", "interrobang"] },
  hostile: { frame: "burst", glyphs: ["grawlix", "storm"] },
};
