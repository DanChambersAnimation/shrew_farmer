import { MOODS, TYPICAL_STATE } from "../characters/mood.ts";
import { Random } from "../core/random.ts";
import { defineTrait } from "../core/trait.ts";
import { AudienceModel } from "./audience-model.ts";

/**
 * A dev tool: every `every` seconds, moves one random audience member under
 * this object into a random different mood. Handy for watching mood-driven
 * features (like speech bubbles) without playing a round.
 */
export const MoodStirrer = defineTrait({
  name: "mood-stirrer",
  defaults: { every: 1.2, seed: 4 },
  setup({ object, settings: s }) {
    const rng = new Random(s.seed);
    let since = 0;
    return {
      update(dt) {
        since += dt;
        if (since < s.every) return;
        since = 0;
        const people = [...object.descendants()].filter((o) => o.has(AudienceModel));
        if (people.length === 0) return;
        const model = rng.pick(people).settingsOf(AudienceModel)!;
        model.state = { ...TYPICAL_STATE[rng.pick(MOODS)] };
      },
    };
  },
});
