/**
 * A paper rig: a flat 2D character built from stacked SVG layers. Static layers
 * always draw; slot layers draw one of several named variants (an arm pose, a
 * mouth shape...). Drawings may contain `{{name}}` placeholders, filled from the
 * rig's params (e.g. colours), so one rig can draw many different-looking people.
 * Characters are rig data; the renderer knows nothing about them.
 */

export interface StaticLayer {
  readonly svg: string;
}

export interface SlotLayer {
  /** Slot name, e.g. "mouth". */
  readonly slot: string;
  readonly variants: Readonly<Record<string, string>>;
  readonly defaultVariant: string;
  /** Optional SVG transform applied to the slot, e.g. a mirror for the other arm. */
  readonly transform?: string;
}

export type RigLayer = StaticLayer | SlotLayer;

export interface Rig {
  readonly width: number;
  readonly height: number;
  readonly layers: readonly RigLayer[];
  /** Default values for `{{name}}` placeholders. */
  readonly params?: Readonly<Record<string, string>>;
}

/** Which variant each slot shows. Missing slots use their default. */
export type RigSelection = Readonly<Record<string, string>>;

/** Placeholder values. Missing params use the rig's defaults. */
export type RigParams = Readonly<Record<string, string>>;

function isSlot(layer: RigLayer): layer is SlotLayer {
  return "slot" in layer;
}

export function slotNames(rig: Rig): string[] {
  // Several layers may share a slot (e.g. hair drawn behind and in front of the head).
  return [...new Set(rig.layers.filter(isSlot).map((l) => l.slot))];
}

export function variantNames(rig: Rig, slot: string): string[] {
  const layer = rig.layers.find((l) => isSlot(l) && l.slot === slot) as SlotLayer | undefined;
  if (!layer) throw new Error(`Rig has no slot "${slot}"`);
  return Object.keys(layer.variants);
}

/** Render the rig as an SVG string. `viewBox` crops it (e.g. a head close-up). */
export function renderRig(
  rig: Rig,
  selection: RigSelection = {},
  viewBox = `0 0 ${rig.width} ${rig.height}`,
  params: RigParams = {},
): string {
  const known = new Set(slotNames(rig));
  for (const slot of Object.keys(selection)) {
    if (!known.has(slot)) throw new Error(`Rig has no slot "${slot}"`);
  }
  const body = rig.layers
    .map((layer) => {
      if (!isSlot(layer)) return layer.svg;
      const name = selection[layer.slot] ?? layer.defaultVariant;
      const svg = layer.variants[name];
      if (svg === undefined) throw new Error(`Slot "${layer.slot}" has no variant "${name}"`);
      return layer.transform ? `<g transform="${layer.transform}">${svg}</g>` : svg;
    })
    .join("");
  const values = { ...rig.params, ...params };
  for (const name of Object.keys(params)) {
    if (!(name in (rig.params ?? {}))) throw new Error(`Rig has no param "${name}"`);
  }
  const filled = body.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`Rig param "${name}" has no value`);
    return value;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${filled}</svg>`;
}
