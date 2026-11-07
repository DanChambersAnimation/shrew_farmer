const OUTLINE = "#2b1d14";
const LINE = `stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"`;
const LINE_THIN = `stroke="${OUTLINE}" stroke-width="3" stroke-linecap="round" fill="none"`;
const LINE_THICK = `stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round" fill="none"`;
const INK = `fill="${OUTLINE}"`;
const MOUTH_FILL = `fill="#5a1a22" ${LINE}`;

/**
 * The audience face, drawn as separate parts around the face centre (150, 125)
 * so eyes, brows, mouth and nose can change independently. Expressions are
 * built from these parts; nothing here knows about a person's identity.
 */

export const EYES = {
  open: `<ellipse cx="-28" cy="-7" rx="6" ry="8" ${INK}/><ellipse cx="28" cy="-7" rx="6" ry="8" ${INK}/>`,
  blink: `<path d="M -34 -6 Q -28 2 -22 -6 M 22 -6 Q 28 2 34 -6" ${LINE_THIN}/>`,
  heavy: `<ellipse cx="-28" cy="-6" rx="6" ry="5" ${INK}/><ellipse cx="28" cy="-6" rx="6" ry="5" ${INK}/><path d="M -35 -12 L -21 -12 M 21 -12 L 35 -12" ${LINE_THIN}/>`,
  closed: `<path d="M -34 -4 Q -28 4 -22 -4 M 22 -4 Q 28 4 34 -4" ${LINE_THIN}/>`,
  wide: `<circle cx="-28" cy="-7" r="12" fill="#fff" ${LINE}/><circle cx="28" cy="-7" r="12" fill="#fff" ${LINE}/><circle cx="-28" cy="-6" r="4" ${INK}/><circle cx="28" cy="-6" r="4" ${INK}/>`,
  squint: `<path d="M -36 -10 L -20 -10 M 20 -10 L 36 -10" ${LINE_THICK}/><path d="M -34 -9 Q -28 2 -22 -9 Z M 22 -9 Q 28 2 34 -9 Z" ${INK}/>`,
} as const;

export const BROWS = {
  level: "",
  attentive: `<path d="M -42 -28 L -16 -22 M 16 -22 L 42 -28" ${LINE_THIN}/>`,
  angry: `<path d="M -40 -26 L -18 -18 M 40 -26 L 18 -18" ${LINE_THICK}/>`,
  worried: `<path d="M -40 -20 Q -28 -30 -16 -22 M 40 -20 Q 28 -30 16 -22" ${LINE_THIN}/>`,
} as const;

export const MOUTHS = {
  line: `<path d="M -12 34 L 12 34" ${LINE_THIN}/>`,
  lineSmall: `<path d="M -8 34 L 8 34" ${LINE_THIN}/>`,
  smile: `<path d="M -18 28 Q 0 42 18 28" ${LINE_THIN}/>`,
  smileWide: `<path d="M -22 26 Q 0 46 22 26" ${LINE_THIN}/>`,
  grin: `<path d="M -18 28 Q 0 42 18 28 Q 0 52 -18 28 Z" ${MOUTH_FILL}/>`,
  frown: `<path d="M -16 40 Q 0 28 16 40" ${LINE_THIN}/>`,
  frownTight: `<path d="M -11 40 Q 0 33 11 40" ${LINE_THIN}/>`,
  parted: `<ellipse cx="0" cy="34" rx="9" ry="6" ${MOUTH_FILL}/>`,
  open: `<ellipse cx="0" cy="38" rx="13" ry="11" ${MOUTH_FILL}/>`,
  o: `<ellipse cx="0" cy="36" rx="8" ry="11" ${MOUTH_FILL}/>`,
  flat: `<path d="M -6 36 L 16 32" ${LINE_THIN}/>`,
  sleep: `<ellipse cx="0" cy="36" rx="6" ry="5" ${MOUTH_FILL}/>`,
} as const;

export const NOSES = {
  still: `<path d="M -4 14 Q 0 20 4 15" ${LINE_THIN}/>`,
  twitch: `<path d="M -6 13 Q 0 21 6 14" ${LINE_THIN}/>`,
} as const;

/** Drool hangs from the corner of the mouth; cleared the moment they re-engage. */
export const DROOL = {
  none: "",
  starting: `<path d="M 10 42 Q 13 50 11 56" stroke="#9fd4ff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"/>`,
  long: `<path d="M 10 42 Q 15 54 11 64" stroke="#9fd4ff" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"/><ellipse cx="11" cy="68" rx="4" ry="6" fill="#9fd4ff" opacity="0.85"/>`,
} as const;

/** A manga sleep bubble at the nostril, breathing through four sizes. */
export const BUBBLE = {
  none: "",
  tiny: bubble(5),
  small: bubble(8),
  big: bubble(11),
} as const;

function bubble(radius: number): string {
  return `<circle cx="${34 + radius}" cy="${12 - radius * 0.4}" r="${radius}" fill="#eaf6ff" fill-opacity="0.85" ${LINE}/>`;
}
