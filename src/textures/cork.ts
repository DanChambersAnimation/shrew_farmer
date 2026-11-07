import { Random } from "../core/random.ts";
import { textures } from "./library.ts";

/** Cork board: warm brown with fine light and dark speckles. */
textures.register("cork", (ctx, size) => {
  ctx.fillStyle = "#b5895a";
  ctx.fillRect(0, 0, size, size);
  const rng = new Random(5);
  for (let i = 0; i < 9000; i++) {
    const light = rng.next() < 0.5;
    ctx.fillStyle = light ? "rgba(225, 190, 140, 0.5)" : "rgba(95, 60, 30, 0.45)";
    const r = 0.6 + rng.next() * 1.6;
    ctx.fillRect(rng.next() * size, rng.next() * size, r, r);
  }
});
