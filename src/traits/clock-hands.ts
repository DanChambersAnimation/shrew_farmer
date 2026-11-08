import { defineTrait } from "../core/trait.ts";

/**
 * Turns an object's children named "hour-hand", "minute-hand" and
 * "second-hand" to show the real local time. Hands point up (+y) at 12 and
 * turn clockwise as seen from the clock's front (+z).
 */
export const ClockHands = defineTrait({
  name: "clock-hands",
  defaults: {},
  setup({ object }) {
    // Looked up each frame: a prefab's children are created after its traits.
    const hand = (kind: string) => object.children.find((c) => c.kind === kind)?.node;
    return {
      update() {
        const [hour, minute, second] = [
          hand("hour-hand"),
          hand("minute-hand"),
          hand("second-hand"),
        ];
        const now = new Date();
        const s = now.getSeconds() + now.getMilliseconds() / 1000;
        const m = now.getMinutes() + s / 60;
        const h = (now.getHours() % 12) + m / 60;
        const turn = (fraction: number) => -fraction * Math.PI * 2;
        if (hour) hour.rotation.z = turn(h / 12);
        if (minute) minute.rotation.z = turn(m / 60);
        if (second) second.rotation.z = turn(Math.floor(s) / 60);
      },
    };
  },
});
