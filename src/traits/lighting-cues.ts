import { defineTrait } from "../core/trait.ts";

/** World event: switch to the next lighting cue. */
export const NEXT_CUE = "lighting:next";
/** World event emitted with the name of the cue now active. */
export const CUE_CHANGED = "lighting:cue";

/**
 * Named lighting states for a room. Each cue sets a brightness (0..1) for light
 * groups (see Light's `group`); lights fade to their new levels. Cycles through
 * the cues on the NEXT_CUE world event.
 */
export const LightingCues = defineTrait({
  name: "lighting-cues",
  defaults: {
    cues: {} as Record<string, Record<string, number>>,
    /** The cue to start in; defaults to the first. */
    active: "",
  },
  setup({ world, settings: s }) {
    const names = () => Object.keys(s.cues);
    const apply = (name: string) => {
      const cue = s.cues[name];
      if (!cue) throw new Error(`No lighting cue "${name}"`);
      s.active = name;
      for (const [group, level] of Object.entries(cue)) world.lightLevels.set(group, level);
      world.events.emit(CUE_CHANGED, name);
    };
    apply(s.active || names()[0]!);
    const off = world.events.on(NEXT_CUE, () => {
      const list = names();
      apply(list[(list.indexOf(s.active) + 1) % list.length]!);
    });
    return () => {
      off();
      world.lightLevels.clear();
    };
  },
});
