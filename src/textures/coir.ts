import { Random } from "../core/random.ts";
import { textures } from "./library.ts";

/** Coir doormat: coarse brown bristles in short random strokes. */
textures.register("coir", (ctx, size) => {
  ctx.fillStyle = "#7a5530";
  ctx.fillRect(0, 0, size, size);
  const rng = new Random(17);
  const browns = ["#8f6438", "#6b4826", "#a07443", "#5c3d1f", "#b08250"];
  for (let i = 0; i < 14000; i++) {
    ctx.strokeStyle = rng.pick(browns);
    ctx.lineWidth = 1 + rng.next();
    const x = rng.next() * size;
    const y = rng.next() * size;
    const a = rng.next() * Math.PI;
    const l = 3 + rng.next() * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
});
