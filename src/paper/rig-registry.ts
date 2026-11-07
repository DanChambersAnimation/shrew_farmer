import { Registry } from "../core/registry.ts";
import type { Rig } from "./rig.ts";

/** Every paper rig, by name. Character modules register themselves here. */
export const rigs = new Registry<Rig>("rig");
