import { defineTrait } from "../core/trait.ts";
import { chooseHand, itemPool, RACK_SIZE } from "../gambits/draw.ts";
import { Gambits } from "./gambits.ts";

/**
 * Fills the round's hand. The Gambits trait decides what is playable; this
 * trait decides what is offered in the first place, so a room can be given a
 * fixed hand or a randomly drawn one without changing either.
 */
export const GambitSelection = defineTrait({
  name: "gambit-selection",
  defaults: {
    /** Fixed ids to offer instead of drawing, in display order. Empty means draw. */
    hand: [] as string[],
    /** How many to draw when `hand` is empty. */
    count: RACK_SIZE,
    /** Seed for the draw, so a seeded round offers the same rack. */
    seed: 0,
    /** When true a random seed is picked each time the room opens. */
    random: true,
  },
  setup({ object, settings }) {
    const gambits = object.settingsOf(Gambits);
    if (!gambits) throw new Error("GambitSelection requires Gambits on the same object");
    gambits.hand =
      settings.hand.length > 0
        ? [...settings.hand]
        : chooseHand(
            itemPool(),
            settings.random ? Math.floor(Math.random() * 0x100000000) : settings.seed,
            settings.count,
          );
  },
});
