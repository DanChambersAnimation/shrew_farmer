import { trait } from "../../core/trait.ts";
import { Billboard } from "../../traits/billboard.ts";
import { Sign } from "../../traits/sign.ts";
import { Transform } from "../../traits/transform.ts";
import type { ItemDef } from "../effect.ts";
import { items } from "../registry.ts";

/** A rhythmic three-part line draws listeners back into the talk. */
export const ruleOfThree: ItemDef = {
  id: "rule-of-three",
  name: "Rule of three",
  medal: { shape: "round", emblem: "three", metal: 0xe9a84d },
  usage: { maxUses: 3, usesPerEffect: 3, cooldownSeconds: 0 },
  visual: {
    kind: "rule-of-three-visual",
    traits: [
      trait(Transform, { position: [0, 2.4, 0] }),
      trait(Billboard),
      trait(Sign, { text: "One. Two. Three.", width: 1.7, height: 0.4 }),
    ],
  },
  simulation: {
    outcomes: [
      {
        weight: 1,
        target: { kind: "audience" },
        description: "The rhythm draws listeners back in.",
        effects: [
          {
            name: "rule-of-three",
            amount: { engagement: 0.14, approval: 0.03 },
            reaches: ({ state }) => state.engagement > 0.15,
            scale: ({ personality }) => 0.65 + 0.7 * personality.intelligence,
          },
        ],
      },
    ],
  },
};

/** A modest religious appeal, welcomed by some and resisted by others. */
export const piousStatement: ItemDef = {
  id: "pious-statement",
  name: "Pious statement",
  medal: { shape: "square", emblem: "book", metal: 0xa7b6be },
  usage: { maxUses: null, usesPerEffect: 1, cooldownSeconds: 12 },
  visual: {
    kind: "pious-statement-visual",
    traits: [
      trait(Transform, { position: [0, 2.4, 0] }),
      trait(Billboard),
      trait(Sign, { text: "A solemn word", width: 1.5, height: 0.4 }),
    ],
  },
  simulation: {
    outcomes: [
      {
        weight: 1,
        target: { kind: "audience" },
        description: "The room weighs the speaker's sincerity.",
        effects: [
          {
            name: "pious-statement",
            amount: { approval: 0.14 },
            reaches: ({ state }) => state.engagement > 0.15,
            scale: ({ personality }) => 2 * personality.faithAffinity - 1,
          },
        ],
      },
    ],
  },
};

/** A bold appeal polarises listeners according to their faith affinity. */
export const praiseJesus: ItemDef = {
  id: "praise-jesus",
  name: "Praise Jesus!",
  medal: { shape: "round", emblem: "praise", metal: 0xf4c746 },
  usage: { maxUses: 1, usesPerEffect: 1, cooldownSeconds: 0 },
  visual: {
    kind: "praise-jesus-visual",
    traits: [
      trait(Transform, { position: [0, 2.4, 0] }),
      trait(Billboard),
      trait(Sign, { text: "Praise Jesus!", width: 1.6, height: 0.4 }),
    ],
  },
  simulation: {
    outcomes: [
      {
        weight: 1,
        target: { kind: "audience" },
        description: "The declaration divides the room.",
        effects: [
          {
            name: "praise-jesus",
            amount: { approval: 0.35 },
            reaches: ({ state }) => state.engagement > 0.15,
            scale: ({ personality }) => 2 * personality.faithAffinity - 1,
          },
        ],
      },
    ],
  },
};

items.register(ruleOfThree.id, ruleOfThree);
items.register(piousStatement.id, piousStatement);
items.register(praiseJesus.id, praiseJesus);
