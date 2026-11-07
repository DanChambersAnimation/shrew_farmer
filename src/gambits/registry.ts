import { Registry } from "../core/registry.ts";
import type { ItemDef } from "./effect.ts";

/** Every gambit, power-up and equipment item, by id. Item modules register themselves here. */
export const items = new Registry<ItemDef>("item");
