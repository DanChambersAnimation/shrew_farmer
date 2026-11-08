import { Vector3 } from "three";
import { MOOD_BUBBLES, TAIL_TIP } from "../characters/speech-bubble.ts";
import type { GameObject } from "../core/game-object.ts";
import { Random } from "../core/random.ts";
import { spawnSpec } from "../core/spec.ts";
import { defineTrait, trait } from "../core/trait.ts";
import { Billboard } from "./billboard.ts";
import { MOOD_CHANGED, type MoodChange } from "./mood-watch.ts";
import { PaperFigure } from "./paper-figure.ts";
import { Transform } from "./transform.ts";

interface Request {
  readonly change: MoodChange;
  age: number;
}

interface Shown {
  readonly who: GameObject;
  readonly bubble: GameObject;
  age: number;
}

/** Overshoot ease for popping in: 0 → a bit past 1 → 1. */
function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/**
 * Shows speech bubbles over audience members whose mood changes (MOOD_CHANGED),
 * drawn from MOOD_BUBBLES. Keeps it readable: at most `maxShown` at once, at
 * least `gap` seconds between new ones, a `cooldown` per person, requests
 * dropped after `expire` seconds, bigger swings first, and only for people on
 * camera and not right beside a bubble already showing. Put it on a room.
 */
export const BubbleDirector = defineTrait({
  name: "bubble-director",
  defaults: {
    maxShown: 2,
    gap: 1,
    cooldown: 8,
    expire: 1.5,
    hold: 2.5,
    /** Bubble width, metres. */
    size: 1.2,
    /** Bubble height above the person's seat point, metres. */
    above: 1.45,
    /** Minimum on-screen distance between bubbles (normalised screen units). */
    spacing: 0.35,
    seed: 1,
  },
  setup({ object: room, world, settings: s }) {
    const rng = new Random(s.seed);
    const queue: Request[] = [];
    const shown: Shown[] = [];
    const lastShown = new Map<GameObject, number>();
    let clock = 0;
    let sinceLast = Infinity;
    const off = world.events.on(MOOD_CHANGED, (payload) => {
      queue.push({ change: payload as MoodChange, age: 0 });
    });
    const POP_IN = 0.25;
    const POP_OUT = 0.3;

    const screen = (position: Vector3) => position.clone().project(world.viewCamera);
    const anchorOf = (who: GameObject) =>
      who.node.getWorldPosition(new Vector3()).add(new Vector3(0, s.above, 0));

    const eligible = ({ change }: Request): boolean => {
      const { who } = change;
      if (shown.some((b) => b.who === who)) return false;
      if (clock - (lastShown.get(who) ?? -Infinity) < s.cooldown) return false;
      const p = screen(anchorOf(who));
      if (p.z > 1 || Math.abs(p.x) > 0.92 || Math.abs(p.y) > 0.92) return false;
      return shown.every((b) => {
        const q = screen(anchorOf(b.who));
        return Math.hypot(p.x - q.x, p.y - q.y) >= s.spacing;
      });
    };

    const show = ({ change }: Request) => {
      const look = MOOD_BUBBLES[change.to];
      const bubble = spawnSpec(room, {
        kind: "speech-bubble",
        traits: [
          trait(Transform, {
            position: anchorOf(change.who).toArray() as [number, number, number],
          }),
          trait(PaperFigure, {
            rig: "speech-bubble",
            slots: { frame: look.frame, glyph: rng.pick(look.glyphs) },
            scale: s.size / 200, // the bubble rig is 200 units wide
            anchor: [...TAIL_TIP],
            selfLight: 1,
          }),
          trait(Billboard),
        ],
      });
      bubble.node.scale.setScalar(0.001);
      shown.push({ who: change.who, bubble, age: 0 });
      lastShown.set(change.who, clock);
      sinceLast = 0;
    };

    return {
      update(dt) {
        clock += dt;
        sinceLast += dt;
        // Age and animate the bubbles on screen; remove finished ones (iterating a
        // copy, since finished ones are removed as we go).
        for (const b of Array.from(shown)) {
          b.age += dt;
          const end = POP_IN + s.hold + POP_OUT;
          const scale =
            b.age < POP_IN
              ? easeOutBack(b.age / POP_IN)
              : b.age < POP_IN + s.hold
                ? 1
                : Math.max(0.001, 1 - (b.age - POP_IN - s.hold) / POP_OUT);
          b.bubble.node.scale.setScalar(Math.max(0.001, scale));
          if (b.age >= end) {
            b.bubble.dispose();
            shown.splice(shown.indexOf(b), 1);
          }
        }
        // Drop stale requests: the moment has passed.
        for (const r of Array.from(queue)) {
          r.age += dt;
          if (r.age > s.expire) queue.splice(queue.indexOf(r), 1);
        }
        if (shown.length >= s.maxShown || sinceLast < s.gap) return;
        const next = queue.filter(eligible).sort((a, b) => b.change.size - a.change.size)[0];
        if (!next) return;
        queue.splice(queue.indexOf(next), 1);
        show(next);
      },
      dispose() {
        off();
        for (const b of shown) b.bubble.dispose();
      },
    };
  },
});

/** How many bubbles a room's director has on screen (for tests and debugging). */
export function bubblesShown(room: GameObject): number {
  return [...room.children].filter((c) => c.kind === "speech-bubble").length;
}
