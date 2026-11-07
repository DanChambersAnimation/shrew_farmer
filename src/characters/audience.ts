import { Random } from "../core/random.ts";
import { type ArmPose, drawArm, type Point, variants } from "../paper/limbs.ts";
import type { Rig, RigParams, RigSelection } from "../paper/rig.ts";
import { rigs } from "../paper/rig-registry.ts";

/*
 * The generic audience member: a seated chibi person facing the camera. Every
 * audience member is this one rig with different slots and colour params.
 * Canvas is 300 x 410. The seat point (hips) is SEAT_POINT; feet reach the
 * floor 100 units below it.
 */

export const SEAT_POINT: Point = [150, 300];

/** Rig rows (units from the top) of the body landmarks used to bend the figure. */
export const LANDMARKS = { neck: 190, hips: 300, knees: 324, feet: 410 } as const;

/**
 * How to bend the flat drawing into a seated pose (see PaperFigure's profile):
 * upright torso, head tipped back by `headTilt` degrees, thighs forward along
 * the seat for `thigh` metres, shins straight down `seatHeight` metres to the floor.
 */
export function seatedProfile(
  scale: number,
  seatHeight: number,
  thigh = 0.34,
  headTilt = 25,
): [number, number, number][] {
  const { neck, hips, knees, feet } = LANDMARKS;
  const neckY = (hips - neck) * scale;
  const headLength = neck * scale;
  const tilt = (headTilt * Math.PI) / 180;
  return [
    [0, neckY + headLength * Math.cos(tilt), -headLength * Math.sin(tilt)],
    [neck, neckY, 0],
    [hips, 0, 0],
    [knees, 0, thigh],
    [feet, -seatHeight, thigh],
  ];
}

const OUTLINE = "#2b1d14";
const LINE = `stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"`;
const thin = (width = 3) =>
  `stroke="${OUTLINE}" stroke-width="${width}" stroke-linecap="round" fill="none"`;
const INK = `fill="${OUTLINE}"`;

/* ---------------- Fixed body ---------------- */

const LEGS = `
<rect x="104" y="288" width="44" height="36" rx="12" fill="{{pants}}" ${LINE}/>
<rect x="152" y="288" width="44" height="36" rx="12" fill="{{pants}}" ${LINE}/>
<rect x="110" y="316" width="32" height="78" rx="10" fill="{{pants}}" ${LINE}/>
<rect x="158" y="316" width="32" height="78" rx="10" fill="{{pants}}" ${LINE}/>
<ellipse cx="124" cy="396" rx="23" ry="10" fill="{{shoes}}" ${LINE}/>
<ellipse cx="176" cy="396" rx="23" ry="10" fill="{{shoes}}" ${LINE}/>`;

const TORSO_PATH =
  "M 100 214 Q 150 198 200 214 Q 212 224 208 250 L 202 300 Q 150 310 98 300 L 92 250 Q 88 224 100 214 Z";

const HEAD = `
<rect x="137" y="186" width="26" height="24" fill="{{skin}}" ${LINE}/>
<circle cx="72" cy="128" r="13" fill="{{skin}}" ${LINE}/>
<circle cx="228" cy="128" r="13" fill="{{skin}}" ${LINE}/>
<ellipse cx="150" cy="120" rx="80" ry="76" fill="{{skin}}" ${LINE}/>
<ellipse cx="104" cy="146" rx="12" ry="7" fill="#f08a7a" opacity="0.35"/>
<ellipse cx="196" cy="146" rx="12" ry="7" fill="#f08a7a" opacity="0.35"/>`;

/* ---------------- Tops (drawn over the torso) ---------------- */

const torso = `<path d="${TORSO_PATH}" fill="{{top}}" ${LINE}/>`;
const TOPS = {
  tee: `${torso}<path d="M 128 207 Q 150 224 172 207" fill="{{skin}}" ${LINE}/>`,
  collar: `${torso}<path d="M 132 204 L 150 226 L 168 204 L 160 200 L 150 212 L 140 200 Z" fill="{{accent}}" ${LINE}/><circle cx="150" cy="242" r="3" ${INK}/><circle cx="150" cy="262" r="3" ${INK}/>`,
  cardigan: `<path d="${TORSO_PATH}" fill="{{accent}}" ${LINE}/><path d="M 100 214 Q 120 206 138 204 L 146 304 Q 120 304 98 300 L 92 250 Q 88 224 100 214 Z" fill="{{top}}" ${LINE}/><path d="M 200 214 Q 180 206 162 204 L 154 304 Q 180 304 202 300 L 208 250 Q 212 224 200 214 Z" fill="{{top}}" ${LINE}/><circle cx="142" cy="240" r="3.5" ${INK}/><circle cx="142" cy="266" r="3.5" ${INK}/>`,
  hoodie: `${torso}<path d="M 112 210 Q 150 236 188 210 Q 176 198 150 198 Q 124 198 112 210 Z" fill="{{accent}}" ${LINE}/><path d="M 140 222 L 138 248 M 160 222 L 162 248" ${thin()}/><path d="M 118 268 L 182 268 L 176 296 L 124 296 Z" fill="none" ${LINE}/>`,
} as const;

/* ---------------- Hair: drawn behind and in front of the head ---------------- */

const HAIR_FILL = `fill="{{hair}}" ${LINE}`;
const HAIR = {
  short: {
    back: "",
    front: `<path d="M 70 122 C 64 60 108 38 150 38 C 192 38 236 60 230 122 C 222 96 208 82 188 76 C 164 88 124 88 104 78 C 88 86 76 102 70 122 Z" ${HAIR_FILL}/>`,
  },
  long: {
    back: `<path d="M 66 110 C 60 50 110 34 150 34 C 190 34 240 50 234 110 L 240 236 Q 150 250 60 236 Z" ${HAIR_FILL}/>`,
    front: `<path d="M 68 140 C 60 64 106 38 150 38 C 194 38 240 64 232 140 C 224 104 204 80 168 72 C 150 92 118 98 96 92 C 80 104 72 120 68 140 Z" ${HAIR_FILL}/>`,
  },
  bun: {
    back: `<circle cx="150" cy="34" r="26" ${HAIR_FILL}/>`,
    front: `<path d="M 72 116 C 66 62 110 44 150 44 C 190 44 234 62 228 116 C 214 86 186 68 150 68 C 114 68 86 86 72 116 Z" ${HAIR_FILL}/>`,
  },
  curly: {
    back: "",
    front: [
      [78, 104],
      [86, 74],
      [108, 52],
      [136, 42],
      [164, 42],
      [192, 52],
      [214, 74],
      [222, 104],
      [124, 66],
      [150, 60],
      [176, 66],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" ${HAIR_FILL}/>`)
      .join(""),
  },
  bald: {
    back: "",
    front: `<ellipse cx="76" cy="104" rx="10" ry="20" ${HAIR_FILL}/><ellipse cx="224" cy="104" rx="10" ry="20" ${HAIR_FILL}/><path d="M 118 58 Q 132 52 146 56" stroke="#fff" stroke-width="5" opacity="0.5" fill="none" stroke-linecap="round"/>`,
  },
} as const;

/* ---------------- Glasses ---------------- */

const GLASSES = {
  none: "",
  round: `<circle cx="122" cy="118" r="20" fill="#fff" fill-opacity="0.2" ${LINE}/><circle cx="178" cy="118" r="20" fill="#fff" fill-opacity="0.2" ${LINE}/><path d="M 142 116 Q 150 110 158 116 M 102 116 L 72 112 M 198 116 L 228 112" ${thin()}/>`,
} as const;

/* ---------------- Faces: drawn around the face centre (150, 125) ---------------- */

const dotEyes = `<ellipse cx="-28" cy="-7" rx="6" ry="8" ${INK}/><ellipse cx="28" cy="-7" rx="6" ry="8" ${INK}/>`;
const mouthFill = `fill="#5a1a22" ${LINE}`;

export const FACES = {
  focused: `${dotEyes}<path d="M -42 -28 L -16 -22 M 16 -22 L 42 -28 M -8 34 L 8 34" ${thin()}/>`,
  neutral: `${dotEyes}<path d="M -12 34 L 12 34" ${thin()}/>`,
  smile: `${dotEyes}<path d="M -18 28 Q 0 42 18 28" ${thin()}/>`,
  laugh: `<path d="M -38 -4 Q -28 -16 -18 -4 M 18 -4 Q 28 -16 38 -4" ${thin(4)}/><path d="M -24 24 Q 0 28 24 24 Q 20 52 0 54 Q -20 52 -24 24 Z" ${mouthFill}/><path d="M -12 46 Q 0 38 12 46 Q 6 52 0 52 Q -6 52 -12 46 Z" fill="#e0707a"/>`,
  bored: `<path d="M -36 -10 L -20 -10 M 20 -10 L 36 -10" ${thin(4)}/><path d="M -34 -9 Q -28 2 -22 -9 Z M 22 -9 Q 28 2 34 -9 Z" ${INK}/><path d="M -6 36 L 16 32" ${thin()}/>`,
  frown: `${dotEyes}<path d="M -40 -26 L -18 -18 M 40 -26 L 18 -18" ${thin(4)}/><path d="M -16 40 Q 0 28 16 40" ${thin()}/>`,
  shocked: `<circle cx="-28" cy="-7" r="12" fill="#fff" ${LINE}/><circle cx="28" cy="-7" r="12" fill="#fff" ${LINE}/><circle cx="-28" cy="-6" r="4" ${INK}/><circle cx="28" cy="-6" r="4" ${INK}/><path d="M -40 -32 Q -28 -40 -16 -32 M 16 -32 Q 28 -40 40 -32" ${thin()}/><ellipse cx="0" cy="36" rx="10" ry="13" ${mouthFill}/>`,
  asleep: `<path d="M -38 -6 Q -28 2 -18 -6 M 18 -6 Q 28 2 38 -6" ${thin(4)}/><ellipse cx="0" cy="36" rx="6" ry="5" ${mouthFill}/><text x="62" y="-58" font-family="sans-serif" font-weight="bold" font-size="28" ${INK}>z</text><text x="82" y="-82" font-family="sans-serif" font-weight="bold" font-size="20" ${INK}>z</text>`,
} as const;

/* ---------------- Arms: a pose for each side ---------------- */

const SHOULDER: Point = [194, 222];
const MIRROR = "translate(300 0) scale(-1 1)";

/** Poses are for the screen-right arm; the left arm uses the same pose mirrored. */
const POSES = {
  lap: { label: "lap", elbow: [10, 44], wrist: [-26, 70], hand: "open", handAngle: 170 },
  clap: { label: "clap", elbow: [16, 48], wrist: [-34, 28], hand: "palm", handAngle: -105 },
  crossed: { label: "crossed", elbow: [10, 40], wrist: [-74, 34], hand: "fist", handAngle: 180 },
  raise: { label: "raise", elbow: [30, -34], wrist: [34, -104], hand: "open", handAngle: -90 },
  cheer: { label: "cheer", elbow: [42, -18], wrist: [52, -88], hand: "fist", handAngle: -95 },
  phone: { label: "phone", elbow: [10, 46], wrist: [-32, 52], hand: "fist", handAngle: -150 },
  chin: { label: "chin", elbow: [18, 46], wrist: [-36, -30], hand: "fist", handAngle: -120 },
} as const satisfies Record<string, ArmPose>;

type PoseName = keyof typeof POSES;

const LIMB = {
  outline: OUTLINE,
  skin: "{{skin}}",
  sleeve: "{{top}}",
  width: 20,
  handScale: 0.8,
};

const PHONE = `<rect x="138" y="244" width="24" height="34" rx="4" fill="#222" ${LINE}/><rect x="142" y="249" width="16" height="22" rx="2" fill="#9fd4ff"/>`;

function arms(left: PoseName, right: PoseName, extra = ""): string {
  return `<g transform="${MIRROR}">${drawArm(SHOULDER, POSES[left], LIMB)}</g>${drawArm(SHOULDER, POSES[right], LIMB)}${extra}`;
}

export const ARMS = {
  lap: arms("lap", "lap"),
  clap: arms("clap", "clap"),
  crossed: arms("crossed", "crossed"),
  raise: arms("lap", "raise"),
  cheer: arms("cheer", "cheer"),
  phone: arms("phone", "phone", PHONE),
  chin: arms("lap", "chin"),
} as const;

/* ---------------- The rig ---------------- */

const slot = (name: string, table: Record<string, string>, defaultVariant: string) => ({
  slot: name,
  variants: table,
  defaultVariant,
});

export const AUDIENCE: Rig = {
  width: 300,
  height: 410,
  params: {
    skin: "#eab88f",
    hair: "#5a3a22",
    top: "#c8632b",
    accent: "#f4efe4",
    pants: "#3b4a6b",
    shoes: "#1a1a1a",
  },
  layers: [
    slot(
      "hair",
      variants(HAIR, (h) => h.back),
      "short",
    ),
    { svg: LEGS },
    slot("top", TOPS, "tee"),
    { svg: HEAD },
    { ...slot("face", FACES, "neutral"), transform: "translate(150 125)" },
    slot(
      "hair",
      variants(HAIR, (h) => h.front),
      "short",
    ),
    slot("glasses", GLASSES, "none"),
    slot("arms", ARMS, "lap"),
  ],
};

rigs.register("audience", AUDIENCE);

/* ---------------- Base appearances ---------------- */

export const PALETTES = {
  skin: ["#f6d3b3", "#eab88f", "#d9a066", "#b97a4c", "#8d5532", "#5e3a22"],
  hair: ["#1c1a24", "#3d2a1c", "#6b4226", "#a0522d", "#d9b25f", "#8c8c8c", "#e8e2d6", "#b5342c"],
  top: [
    "#c8632b",
    "#2f6f8f",
    "#7a2e4a",
    "#3f7d4f",
    "#d9b23a",
    "#5b4b8a",
    "#9a9a9a",
    "#e2725b",
    "#264653",
  ],
  accent: ["#f4efe4", "#ffffff", "#e9d8a6", "#cfd8dc"],
  pants: ["#3b4a6b", "#2b2b2b", "#6b5a45", "#4a5d3a", "#7a7a7a"],
  shoes: ["#1a1a1a", "#5a3a22", "#f4f4f4", "#7a2e2e"],
} as const;

export interface AudienceAppearance {
  readonly slots: RigSelection;
  readonly params: RigParams;
}

/** A random but repeatable appearance, independent of the person's inner state. */
export function randomAppearance(seed: number): AudienceAppearance {
  const rng = new Random(seed);
  const params = Object.fromEntries(
    Object.entries(PALETTES).map(([name, colors]) => [name, rng.pick(colors)]),
  );
  return Object.freeze({
    params: Object.freeze(params),
    slots: Object.freeze({
      hair: rng.pick(Object.keys(HAIR)),
      top: rng.pick(Object.keys(TOPS)),
      glasses: rng.next() < 0.25 ? "round" : "none",
    }),
  });
}
