/** Shared limb drawing for paper rigs: arms as sleeve tubes with a hand at the end. */

export type Point = readonly [number, number];
export type HandShape = "open" | "fist" | "point" | "thumbsUp" | "palm";

export interface ArmPose {
  readonly label: string;
  /** Relative to the shoulder. */
  readonly elbow: Point;
  readonly wrist: Point;
  readonly hand: HandShape;
  /** Direction the hand points, degrees (0 = screen right, 90 = down). */
  readonly handAngle: number;
}

export interface LimbStyle {
  readonly outline: string;
  readonly skin: string;
  readonly sleeve: string;
  /** Optional sheen stripe along the sleeve. */
  readonly sleeveShine?: string;
  /** Optional cuff colour at the wrist. */
  readonly cuff?: string;
  /** Sleeve thickness (outline adds 8). */
  readonly width?: number;
  /** Hand size multiplier. */
  readonly handScale?: number;
}

/** Hands are drawn pointing along +x with the thumb toward -y. */
function hand(shape: HandShape, style: LimbStyle): string {
  const skin = `fill="${style.skin}" stroke="${style.outline}" stroke-width="3" stroke-linejoin="round"`;
  const line = `stroke="${style.outline}" stroke-width="2" stroke-linecap="round"`;
  switch (shape) {
    case "open":
      return `<ellipse cx="8" cy="-14" rx="6" ry="10" transform="rotate(-35 8 -14)" ${skin}/><ellipse cx="17" cy="0" rx="17" ry="14" ${skin}/><path d="M 24 -5 L 32 -5 M 25 1 L 33 1 M 24 7 L 31 7" ${line}/>`;
    case "palm":
      return `<ellipse cx="6" cy="-13" rx="5" ry="9" transform="rotate(-50 6 -13)" ${skin}/><ellipse cx="18" cy="0" rx="20" ry="11" ${skin}/><path d="M 28 -4 L 36 -4 M 29 2 L 37 2" ${line}/>`;
    case "fist":
      return `<circle cx="13" cy="0" r="15" ${skin}/><path d="M 21 -9 Q 27 0 21 9" ${line} stroke-width="2.5" fill="none"/>`;
    case "point":
      return `<rect x="16" y="-12" width="30" height="10" rx="5" ${skin}/><circle cx="11" cy="1" r="13" ${skin}/>`;
    case "thumbsUp":
      return `<circle cx="13" cy="0" r="15" ${skin}/><rect x="5" y="-36" width="12" height="28" rx="6" ${skin}/><path d="M 21 -6 L 26 -6 M 21 2 L 26 2" ${line}/>`;
  }
}

/** Draw one arm from `shoulder` (absolute rig coords) in the given pose. */
export function drawArm(shoulder: Point, pose: ArmPose, style: LimbStyle): string {
  const [sx, sy] = shoulder;
  const [ex, ey] = [sx + pose.elbow[0], sy + pose.elbow[1]];
  const [wx, wy] = [sx + pose.wrist[0], sy + pose.wrist[1]];
  const width = style.width ?? 26;
  const d = `M ${sx} ${sy} L ${ex} ${ey} L ${wx} ${wy}`;
  const tube = (color: string, w: number, extra = "") =>
    `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const scale = style.handScale ?? 1;
  return [
    tube(style.outline, width + 8),
    tube(style.sleeve, width),
    style.sleeveShine
      ? tube(style.sleeveShine, width * 0.27, `opacity="0.7" transform="translate(-4 -4)"`)
      : "",
    style.cuff
      ? `<circle cx="${wx}" cy="${wy}" r="${width * 0.46}" fill="${style.cuff}" stroke="${style.outline}" stroke-width="3"/>`
      : "",
    `<g transform="translate(${wx} ${wy}) rotate(${pose.handAngle}) scale(${scale})">${hand(pose.hand, style)}</g>`,
  ].join("");
}

/** Build a variant table by rendering each entry. */
export function variants<T>(
  table: Readonly<Record<string, T>>,
  render: (value: T) => string,
): Record<string, string> {
  return Object.fromEntries(Object.entries(table).map(([name, v]) => [name, render(v)]));
}
