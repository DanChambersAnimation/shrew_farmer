import { type ArmPose, drawArm, type Point, variants } from "../paper/limbs.ts";
import type { Rig } from "../paper/rig.ts";
import { rigs } from "../paper/rig-registry.ts";

/*
 * The protagonist: a chibi motivational speaker. Slicked-back hair, sunglasses,
 * shiny suit. Canvas is 400 x 560; the character faces the viewer.
 */

export const PALETTE = {
  outline: "#2b1d14",
  skin: "#f2c48d",
  blush: "#f08a7a",
  hair: "#1c1a24",
  hairShine: "#8ea2c8",
  lens: "#101018",
  suitDark: "#2e4a9e",
  suitMid: "#4f7be0",
  suitLight: "#c4dcff",
  shirt: "#ffffff",
  tie: "#f2b632",
  shoes: "#1a1a1a",
  mouth: "#5a1a22",
  tongue: "#e0707a",
  teeth: "#ffffff",
} as const;

const P = PALETTE;
const LINE = `stroke="${P.outline}" stroke-width="4" stroke-linejoin="round"`;

const DEFS = `<defs>
<linearGradient id="spk-suit" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="${P.suitDark}"/><stop offset="0.3" stop-color="${P.suitMid}"/>
<stop offset="0.48" stop-color="${P.suitLight}"/><stop offset="0.62" stop-color="${P.suitMid}"/>
<stop offset="1" stop-color="${P.suitDark}"/></linearGradient>
</defs>`;

const LEGS = `
<rect x="163" y="448" width="32" height="72" rx="10" fill="url(#spk-suit)" ${LINE}/>
<rect x="205" y="448" width="32" height="72" rx="10" fill="url(#spk-suit)" ${LINE}/>
<ellipse cx="174" cy="524" rx="28" ry="13" fill="${P.shoes}" ${LINE}/>
<ellipse cx="226" cy="524" rx="28" ry="13" fill="${P.shoes}" ${LINE}/>
<path d="M 160 520 Q 170 514 182 516 M 214 516 Q 226 514 236 518" stroke="#fff" stroke-width="3" opacity="0.5" fill="none" stroke-linecap="round"/>`;

const TORSO = `
<rect x="186" y="280" width="28" height="40" fill="${P.skin}" ${LINE}/>
<path d="M 145 318 Q 200 300 255 318 Q 268 330 262 360 L 250 462 Q 200 474 150 462 L 138 360 Q 132 330 145 318 Z" fill="url(#spk-suit)" ${LINE}/>
<path d="M 178 313 L 222 313 L 200 378 Z" fill="${P.shirt}" ${LINE}/>
<path d="M 193 318 L 207 318 L 204 330 L 212 384 L 200 398 L 188 384 L 196 330 Z" fill="${P.tie}" stroke="${P.outline}" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M 178 311 L 200 378 L 186 342 L 164 322 Z" fill="${P.suitDark}" ${LINE}/>
<path d="M 222 311 L 200 378 L 214 342 L 236 322 Z" fill="${P.suitDark}" ${LINE}/>
<circle cx="200" cy="418" r="4.5" fill="${P.tie}"/><circle cx="200" cy="440" r="4.5" fill="${P.tie}"/>
<path d="M 158 338 Q 164 400 157 452" stroke="#fff" stroke-width="5" opacity="0.45" fill="none" stroke-linecap="round"/>
<path d="M 242 340 Q 237 380 243 428" stroke="#fff" stroke-width="4" opacity="0.3" fill="none" stroke-linecap="round"/>`;

const HEAD = `
<circle cx="90" cy="200" r="18" fill="${P.skin}" ${LINE}/>
<circle cx="310" cy="200" r="18" fill="${P.skin}" ${LINE}/>
<ellipse cx="200" cy="190" rx="112" ry="105" fill="${P.skin}" ${LINE}/>
<ellipse cx="132" cy="232" rx="16" ry="9" fill="${P.blush}" opacity="0.35"/>
<ellipse cx="268" cy="232" rx="16" ry="9" fill="${P.blush}" opacity="0.35"/>
<path d="M 196 214 Q 204 220 198 226" stroke="${P.outline}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

const HAIR = `
<path d="M 87 188 C 78 104 140 64 200 64 C 260 64 322 104 313 188 C 306 160 298 138 278 122 C 252 104 226 100 200 102 C 174 100 148 104 122 122 C 102 138 94 160 87 188 Z" fill="${P.hair}" ${LINE}/>
<g stroke="${P.hairShine}" stroke-linecap="round" fill="none" opacity="0.8">
<path d="M 150 100 C 162 84 182 76 206 73" stroke-width="4.5"/>
<path d="M 188 96 C 200 84 218 78 240 78" stroke-width="4"/>
<path d="M 228 98 C 242 90 258 90 274 96" stroke-width="3.5"/>
<path d="M 118 116 C 126 102 138 92 152 86" stroke-width="3"/>
</g>`;

const GLASSES = `
<path d="M 92 186 L 118 178 M 308 186 L 282 178" stroke="${P.outline}" stroke-width="5" stroke-linecap="round"/>
<path d="M 186 176 Q 200 168 214 176" stroke="${P.outline}" stroke-width="5" fill="none"/>
<rect x="114" y="162" width="76" height="46" rx="16" fill="${P.lens}" ${LINE}/>
<rect x="210" y="162" width="76" height="46" rx="16" fill="${P.lens}" ${LINE}/>
<path d="M 128 172 L 142 172 L 130 196 Z M 224 172 L 238 172 L 226 196 Z" fill="#fff" opacity="0.7"/>
<path d="M 118 152 Q 150 140 182 150 M 218 150 Q 250 140 282 152" stroke="${P.hair}" stroke-width="7" fill="none" stroke-linecap="round"/>`;

/* ---------------- Mouths: lip-sync shapes, drawn around (0, 0) ---------------- */

const M = `fill="${P.mouth}" ${LINE}`;
const TEETH = `fill="${P.teeth}"`;
const TONGUE = `fill="${P.tongue}"`;
const lip = (width = 4) =>
  `stroke="${P.outline}" stroke-width="${width}" fill="none" stroke-linecap="round"`;

/** Mouth shapes and the sounds each one covers (used to drive mouths from text). */
export const MOUTHS = {
  rest: { sounds: "rest / pause", svg: `<path d="M -20 -2 Q 0 9 20 -2" ${lip()}/>` },
  MBP: {
    sounds: "M B P",
    svg: `<path d="M -18 0 Q 0 4 18 0" ${lip(6)}/><path d="M -6 7 Q 0 9 6 7" ${lip(2)} opacity="0.5"/>`,
  },
  AI: {
    sounds: "A I",
    svg: `<path d="M -24 -6 Q 0 -10 24 -6 Q 20 26 0 28 Q -20 26 -24 -6 Z" ${M}/><path d="M -12 21 Q 0 13 12 21 Q 6 27 0 27 Q -6 27 -12 21 Z" ${TONGUE}/><path d="M -20 -5 Q 0 -8 20 -5 L 18 2 Q 0 0 -18 2 Z" ${TEETH}/>`,
  },
  E: {
    sounds: "E",
    svg: `<path d="M -26 -4 Q 0 -6 26 -4 Q 18 12 0 13 Q -18 12 -26 -4 Z" ${M}/><path d="M -22 -3 Q 0 -5 22 -3 L 20 3 Q 0 2 -20 3 Z" ${TEETH}/>`,
  },
  O: {
    sounds: "O",
    svg: `<ellipse rx="13" ry="17" ${M}/><ellipse cy="9" rx="8" ry="5" ${TONGUE}/>`,
  },
  U: {
    sounds: "U W OO",
    svg: `<ellipse rx="8" ry="9" ${M}/><path d="M -14 -5 Q -10 0 -14 5 M 14 -5 Q 10 0 14 5" ${lip(2.5)}/>`,
  },
  FV: {
    sounds: "F V",
    svg: `<path d="M -20 -2 Q 0 -6 20 -2 Q 12 9 0 9 Q -12 9 -20 -2 Z" ${M}/><path d="M -14 -3 L 14 -3 L 13 3 L -13 3 Z" ${TEETH}/><path d="M -17 7 Q 0 1 17 7" ${lip()}/>`,
  },
  L: {
    sounds: "L TH",
    svg: `<path d="M -20 -5 Q 0 -8 20 -5 Q 16 20 0 21 Q -16 20 -20 -5 Z" ${M}/><path d="M -9 18 Q -8 0 0 -1 Q 8 0 9 18 Z" ${TONGUE}/><path d="M -17 -4 Q 0 -7 17 -4 L 15 1 Q 0 -1 -15 1 Z" ${TEETH}/>`,
  },
  etc: {
    sounds: "C D G K N S T X Y Z",
    svg: `<path d="M -22 -5 Q 0 -8 22 -5 Q 18 9 0 10 Q -18 9 -22 -5 Z" ${M}/><path d="M -19 -4 Q 0 -6 19 -4 L 17 7 Q 0 8 -17 7 Z" ${TEETH}/><path d="M -17 1.5 L 17 1.5" stroke="${P.outline}" stroke-width="1.5" opacity="0.4"/>`,
  },
  grin: {
    sounds: "big grin (emphasis)",
    svg: `<path d="M -30 -6 Q 0 -2 30 -6 Q 24 22 0 24 Q -24 22 -30 -6 Z" ${M}/><path d="M -12 19 Q 0 13 12 19 Q 6 23 0 23 Q -6 23 -12 19 Z" ${TONGUE}/><path d="M -27 -5 Q 0 -1 27 -5 L 24 4 Q 0 7 -24 4 Z" ${TEETH}/>`,
  },
} as const;

export type MouthName = keyof typeof MOUTHS;

/* ---------------- Arms: pose data for the screen-right arm ---------------- */

const SHOULDER: Point = [255, 330];

export const ARM_POSES = {
  rest: { label: "Rest", elbow: [8, 60], wrist: [12, 115], hand: "open", handAngle: 90 },
  point: { label: "Point at you", elbow: [45, 15], wrist: [96, -8], hand: "point", handAngle: -12 },
  fistPump: {
    label: "Fist pump",
    elbow: [52, -8],
    wrist: [42, -80],
    hand: "fist",
    handAngle: -100,
  },
  wideOpen: {
    label: "Arms wide",
    elbow: [55, -5],
    wrist: [104, -42],
    hand: "open",
    handAngle: -30,
  },
  oneThing: {
    label: "One thing!",
    elbow: [48, 40],
    wrist: [44, -22],
    hand: "point",
    handAngle: -92,
  },
  thumbsUp: {
    label: "Thumbs up",
    elbow: [40, 46],
    wrist: [74, 16],
    hand: "thumbsUp",
    handAngle: 0,
  },
  heart: {
    label: "Hand on heart",
    elbow: [26, 58],
    wrist: [-26, 30],
    hand: "open",
    handAngle: 180,
  },
  settle: { label: "Settle down", elbow: [42, 42], wrist: [86, 42], hand: "palm", handAngle: 0 },
  present: { label: "Present", elbow: [52, 36], wrist: [108, 24], hand: "open", handAngle: -10 },
  ponder: { label: "Ponder", elbow: [34, 44], wrist: [-32, -30], hand: "fist", handAngle: -125 },
} as const satisfies Record<string, ArmPose>;

export type ArmPoseName = keyof typeof ARM_POSES;

const arm = (pose: ArmPose) =>
  drawArm(SHOULDER, pose, {
    outline: P.outline,
    skin: P.skin,
    sleeve: P.suitMid,
    sleeveShine: P.suitLight,
    cuff: P.shirt,
  });

const ARMS = variants<ArmPose>(ARM_POSES, arm);

export const SPEAKER: Rig = {
  width: 400,
  height: 560,
  layers: [
    { svg: DEFS + LEGS + TORSO + HEAD },
    {
      slot: "mouth",
      variants: variants(MOUTHS, (m) => m.svg),
      defaultVariant: "rest",
      transform: "translate(200 254) scale(1.25)",
    },
    { svg: HAIR + GLASSES },
    {
      slot: "armLeft",
      variants: ARMS,
      defaultVariant: "rest",
      transform: "translate(400 0) scale(-1 1)",
    },
    { slot: "armRight", variants: ARMS, defaultVariant: "rest" },
  ],
};

/** View boxes for cropping the rig. */
export const SPEAKER_VIEWS = {
  full: "0 0 400 560",
  head: "80 60 240 240",
} as const;
rigs.register("speaker", SPEAKER);

/* ---------------- Back view: same slots and poses, seen from behind ---------------- */

const BACK_TORSO = `
<rect x="186" y="280" width="28" height="40" fill="${P.skin}" ${LINE}/>
<path d="M 145 318 Q 200 300 255 318 Q 268 330 262 360 L 250 462 Q 200 474 150 462 L 138 360 Q 132 330 145 318 Z" fill="url(#spk-suit)" ${LINE}/>
<path d="M 170 312 Q 200 302 230 312 L 228 322 Q 200 314 172 322 Z" fill="${P.shirt}" ${LINE}/>
<path d="M 200 320 L 200 468" stroke="${P.suitDark}" stroke-width="3" fill="none"/>
<path d="M 200 436 L 200 468 M 194 436 L 200 444" stroke="${P.outline}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M 158 338 Q 164 400 157 452" stroke="#fff" stroke-width="5" opacity="0.45" fill="none" stroke-linecap="round"/>
<path d="M 242 340 Q 237 380 243 428" stroke="#fff" stroke-width="4" opacity="0.3" fill="none" stroke-linecap="round"/>`;

const BACK_HEAD = `
<ellipse cx="200" cy="190" rx="112" ry="105" fill="${P.skin}" ${LINE}/>
<circle cx="90" cy="200" r="18" fill="${P.skin}" ${LINE}/>
<circle cx="310" cy="200" r="18" fill="${P.skin}" ${LINE}/>
<path d="M 88 195 C 80 110 140 66 200 66 C 260 66 320 110 312 195 C 308 240 290 268 260 278 Q 200 292 140 278 C 110 268 92 240 88 195 Z" fill="${P.hair}" ${LINE}/>
<g stroke="${P.hairShine}" stroke-linecap="round" fill="none" opacity="0.6">
<path d="M 150 86 C 138 150 148 220 168 262" stroke-width="4.5"/>
<path d="M 200 78 C 196 150 198 220 200 270" stroke-width="4"/>
<path d="M 250 86 C 262 150 252 220 232 262" stroke-width="4.5"/>
</g>
`;

const SILENT = variants(MOUTHS, () => "");

/**
 * The Speaker seen from behind. Slots match the front rig, and each arm slot
 * names the same physical arm, so it appears on the opposite side of the screen.
 * Arms are drawn behind the back, so gestures across the chest are hidden.
 */
export const SPEAKER_BACK: Rig = {
  width: 400,
  height: 560,
  layers: [
    { svg: DEFS + LEGS },
    { slot: "mouth", variants: SILENT, defaultVariant: "rest" },
    {
      slot: "armRight",
      variants: ARMS,
      defaultVariant: "rest",
      transform: "translate(400 0) scale(-1 1)",
    },
    { slot: "armLeft", variants: ARMS, defaultVariant: "rest" },
    { svg: BACK_TORSO + BACK_HEAD },
  ],
};

/** Where the Speaker's feet meet the floor, in rig units (both views). */
export const SPEAKER_FEET: Point = [200, 534];

rigs.register("speaker-back", SPEAKER_BACK);
