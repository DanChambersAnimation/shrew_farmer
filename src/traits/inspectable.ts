import type { GameObject } from "../core/game-object.ts";
import { POINTER } from "../core/pointer.ts";
import { defineTrait } from "../core/trait.ts";
import type { World } from "../core/world.ts";

/** World event carrying the info to display, or null to hide it. */
export const INSPECT = "inspect";

export interface InspectInfo {
  readonly title: string;
  readonly description: string;
  readonly source: GameObject;
}

// Hovered inspectables per world, outermost first; the innermost one is shown.
const stacks = new WeakMap<World, InspectInfo[]>();

function publish(world: World): void {
  const stack = stacks.get(world) ?? [];
  world.events.emit(INSPECT, stack.at(-1) ?? null);
}

/** Hovering the object shows its title and description (via the INSPECT world event). */
export const Inspectable = defineTrait({
  name: "inspectable",
  defaults: { title: "", description: "" },
  setup({ object, world, settings }) {
    if (!stacks.has(world)) stacks.set(world, []);
    const stack = stacks.get(world)!;
    const info: InspectInfo = { ...settings, source: object };
    const hide = () => {
      const i = stack.indexOf(info);
      if (i === -1) return;
      stack.splice(i, 1);
      publish(world);
    };
    const offEnter = object.on(POINTER.enter, () => {
      stack.push(info);
      publish(world);
    });
    const offLeave = object.on(POINTER.leave, hide);
    return () => {
      offEnter();
      offLeave();
      hide();
    };
  },
});
