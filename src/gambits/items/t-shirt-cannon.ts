import { Vector3 } from "three";
import { spawnSpec } from "../../core/spec.ts";
import { trait } from "../../core/trait.ts";
import { effects } from "../../effects/registry.ts";
import { TShirtBarrage } from "../../traits/t-shirt-barrage.ts";
import type { Vec3 } from "../../traits/types.ts";
import type { ItemDef } from "../effect.ts";
import { items } from "../registry.ts";
import { LimitedUse, gambitTrait } from "../traits.ts";

/** Three shirts fly into the crowd. Excited listeners love it; a bored one may be hurt. */
export const tShirtCannon: ItemDef = {
  id: "t-shirt-cannon",
  name: "T-shirt cannon",
  summary:
    "Launches T-shirts at 3 randomly chosen audience members. Anyone asleep or switched off may be hurt by it.",
  medal: { shape: "square", emblem: "shirt", metal: 0xc89274 },
  gambitTraits: [gambitTrait(LimitedUse, { count: 1 })],
  visual: { kind: "t-shirt-barrage", traits: [trait(TShirtBarrage)] },
  simulation: {
    outcomes: [
      {
        weight: 1,
        target: { kind: "random", count: 3 },
        description: "Three shirts arc into the crowd.",
        effects: [
          {
            name: "shirt-caught",
            amount: { approval: 0.12, engagement: 0.18 },
            reaches: ({ state }) => state.engagement >= 0.5,
          },
          {
            name: "shirt-injury",
            amount: { approval: -2, engagement: 1 },
            reaches: ({ state, roll }) => state.engagement < 0.5 && roll < 0.35,
          },
        ],
      },
    ],
    onSuccess: [
      { id: "t-shirt-volley" },
      { id: "house-lift" },
      { id: "gambit/t-shirt-cannon/success" },
    ],
    onFailure: [
      { id: "t-shirt-volley" },
      { id: "house-dip" },
      { id: "gambit/t-shirt-cannon/failure" },
    ],
  },
};

/** The visual uses the resolver's exact three targets, with a whomp per launch. */
effects.register("t-shirt-volley", {
  id: "t-shirt-volley",
  kind: "visual",
  run({ room, targets = [] }) {
    if (targets.length === 0) return;
    const speaker = [...room.descendants()].find((object) => object.kind === "speaker");
    const source = speaker?.node.getWorldPosition(new Vector3());
    const origin: Vec3 = source ? [source.x, source.y + 1.4, source.z] : [0, 1.5, 2];
    spawnSpec(room, {
      ...tShirtCannon.visual,
      traits: [trait(TShirtBarrage, { origin, targets: targets.map((target) => [...target]) })],
    });
  },
});

items.register(tShirtCannon.id, tShirtCannon);
