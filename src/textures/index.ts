// Load every texture module so their drawers are registered.
import.meta.glob(["./*.ts", "!./index.ts", "!./library.ts", "!./*.test.ts"], { eager: true });

export { makeTexture, textures } from "./library.ts";
