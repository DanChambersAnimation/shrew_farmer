import { Random } from "../core/random.ts";
import { textures } from "./library.ts";

/** Pale, honey-toned oak. */
const WOODS = ["#d9a86c", "#e2b47a", "#cf9d62", "#e8bd86", "#d4a368", "#dcae74", "#c9965b"];

/**
 * Block parquet: squares of five slats, alternating direction like a
 * chequerboard, with varied wood tones, grain lines and dark joints. Tiles
 * seamlessly (an even number of blocks per side).
 */
textures.register("parquet", (ctx, size) => {
  const blocks = 4;
  const slats = 5;
  const block = size / blocks;
  const slat = block / slats;
  const rng = new Random(7);
  for (let by = 0; by < blocks; by++) {
    for (let bx = 0; bx < blocks; bx++) {
      const across = (bx + by) % 2 === 0;
      for (let i = 0; i < slats; i++) {
        const [x, y, w, h] = across
          ? [bx * block, by * block + i * slat, block, slat]
          : [bx * block + i * slat, by * block, slat, block];
        ctx.fillStyle = rng.pick(WOODS);
        ctx.fillRect(x, y, w, h);
        // Grain: faint streaks running along the slat.
        ctx.strokeStyle = "rgba(90, 50, 20, 0.16)";
        ctx.lineWidth = 1;
        for (let g = 0; g < 4; g++) {
          const offset = (0.15 + rng.next() * 0.7) * (across ? h : w);
          const wobble = (rng.next() - 0.5) * 3;
          ctx.beginPath();
          if (across) {
            ctx.moveTo(x, y + offset);
            ctx.bezierCurveTo(
              x + w / 3,
              y + offset + wobble,
              x + (2 * w) / 3,
              y + offset - wobble,
              x + w,
              y + offset,
            );
          } else {
            ctx.moveTo(x + offset, y);
            ctx.bezierCurveTo(
              x + offset + wobble,
              y + h / 3,
              x + offset - wobble,
              y + (2 * h) / 3,
              x + offset,
              y + h,
            );
          }
          ctx.stroke();
        }
        // Joint around each slat.
        ctx.strokeStyle = "rgba(70, 40, 15, 0.45)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      }
    }
  }
});
