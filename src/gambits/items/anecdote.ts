import { trait } from "../../core/trait.ts";
import { Billboard } from "../../traits/billboard.ts";
import { Sign } from "../../traits/sign.ts";
import { Transform } from "../../traits/transform.ts";
import type { ItemDef } from "../effect.ts";
import { items } from "../registry.ts";
import { Cooldown, LimitedUse, gambitTrait } from "../traits.ts";

/** Tell a story about yourself. People lean in, and remember hearing it. */
export const personalAnecdote: ItemDef = {
  id: "personal-anecdote",
  name: "Personal anecdote",
  medal: { shape: "round", emblem: "story", metal: 0xe7a83d },
  gambitTraits: [gambitTrait(Cooldown, { seconds: 15 })],
  visual: {
    kind: "anecdote-visual",
    traits: [
      trait(Transform, { position: [0, 2.4, 0] }),
      trait(Billboard),
      trait(Sign, { text: "A story...", width: 1.2, height: 0.4 }),
    ],
  },
  simulation: {
    outcomes: [
      {
        weight: 1,
        target: { kind: "audience" },
        description: "They lean in to hear how it turned out.",
        effects: [
          {
            name: "personal-anecdote",
            amount: { approval: 0.1, engagement: 0.25 },
            // Nobody ignores a story they are too bored to follow.
            reaches: ({ state }) => state.engagement > 0.3,
          },
        ],
      },
    ],
    onSuccess: [{ id: "house-lift" }, { id: "gambit/personal-anecdote/success" }],
    onFailure: [{ id: "gambit/personal-anecdote/failure" }],
  },
};

/**
 * Call back to the anecdote. It lands hardest on people who heard it a while
 * ago and have had time to mull it over; too soon and it is just repetition.
 */
export const anecdoteCallback: ItemDef = {
  id: "anecdote-callback",
  name: "Callback to anecdote",
  medal: { shape: "square", emblem: "callback", metal: 0x9274c9 },
  gambitTraits: [gambitTrait(LimitedUse, { count: 1 })],
  visual: {
    kind: "callback-visual",
    traits: [
      trait(Transform, { position: [0, 2.4, 0] }),
      trait(Billboard),
      trait(Sign, { text: "Remember?", width: 1.2, height: 0.4 }),
    ],
  },
  simulation: {
    outcomes: [
      {
        weight: 1,
        target: { kind: "audience" },
        description: "The room recognises the story.",
        effects: [
          {
            name: "anecdote-callback",
            amount: { approval: 0.2, engagement: 0.15 },
            reaches: ({ state }) => state.engagement > 0.3,
            scale: ({ memory, atSeconds }) => {
              const heardAt = memory
                .filter((entry) => entry.id === "personal-anecdote")
                .map((entry) => entry.atSeconds)
                .sort((a, b) => b - a)[0];
              if (heardAt === undefined) return 0.4; // They never heard it: awkward.
              const gap = atSeconds - heardAt;
              // Fifteen seconds is the sweet spot; sooner is flat, later fades.
              return gap < 5 ? 0.7 : gap <= 15 ? 2 : 1.2;
            },
          },
        ],
      },
    ],
    onSuccess: [{ id: "house-lift" }],
    onFailure: [{ id: "house-dip" }, { id: "awkward-silence" }],
  },
};

items.register(personalAnecdote.id, personalAnecdote);
items.register(anecdoteCallback.id, anecdoteCallback);
