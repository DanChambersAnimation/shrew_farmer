// Load every item module so they register themselves.
import.meta.glob(["./items/*.ts", "!./items/*.test.ts"], { eager: true });

export { items } from "./registry.ts";
