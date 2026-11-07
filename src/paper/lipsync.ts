/**
 * Map text to a sequence of mouth shapes. Works with any character whose mouth
 * table lists the letters each shape covers (e.g. "M B P", "L TH").
 */

export interface MouthTable {
  readonly [mouth: string]: { readonly sounds: string };
}

export interface MouthFrame {
  /** The letters this frame covers, e.g. "TH", or " " for a pause. */
  readonly text: string;
  readonly mouth: string;
}

export interface LipSyncOptions {
  /** Mouth for spaces and punctuation. */
  readonly rest: string;
  /** Mouth for letters no entry covers. */
  readonly fallback: string;
}

function soundIndex(table: MouthTable): Map<string, string> {
  const index = new Map<string, string>();
  for (const [mouth, { sounds }] of Object.entries(table)) {
    for (const token of sounds.split(/\s+/)) {
      if (/^[A-Z]{1,2}$/.test(token)) index.set(token, mouth);
    }
  }
  return index;
}

export function mouthsForText(
  text: string,
  table: MouthTable,
  { rest, fallback }: LipSyncOptions,
): MouthFrame[] {
  const index = soundIndex(table);
  const upper = text.toUpperCase();
  const frames: MouthFrame[] = [];
  for (let i = 0; i < upper.length;) {
    const pair = upper.slice(i, i + 2);
    const ch = upper[i]!;
    if (pair.length === 2 && index.has(pair)) {
      frames.push({ text: pair, mouth: index.get(pair)! });
      i += 2;
    } else if (/[A-Z]/.test(ch)) {
      frames.push({ text: ch, mouth: index.get(ch) ?? fallback });
      i += 1;
    } else {
      frames.push({ text: ch, mouth: rest });
      i += 1;
    }
  }
  return frames;
}
