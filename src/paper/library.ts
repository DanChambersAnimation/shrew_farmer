// Load every character module so their rigs are registered.
import.meta.glob(["../characters/*.ts", "!../characters/*.test.ts"], { eager: true });

export { rigs } from "./rig-registry.ts";
