import { Random } from "../core/random.ts";
import { textures } from "./library.ts";

/** Pale honey boards, kept close in tone so the floor reads calm, not stripy. */
const BOARDS = ["#cf9a64", "#d3a069", "#cb9660", "#d19d66", "#cd9862"];

/**
 * Floorboards running along the texture's width (u): equal-length boards with
 * a regular stagger between rows, soft grain and nail marks. Tiles seamlessly.
 */
textures.register("floorboards", (ctx, size) => {
  const rows = 10;
  const board = size / rows;
  const length = size / 2; // two boards per row per repeat
  const rng = new Random(11);
  for (let r = 0; r < rows; r++) {
    const y = r * board;
    // Joints step along by a quarter board each row, repeating every 4 rows.
    const offset = (((r * 3) % 4) / 4) * length;
    for (let k = -1; k < 2; k++) {
      const x = offset + k * length;
      ctx.fillStyle = rng.pick(BOARDS);
      ctx.fillRect(x, y, length, board);
      ctx.strokeStyle = "rgba(110, 65, 30, 0.12)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 3; g++) {
        const gy = y + (0.25 + rng.next() * 0.5) * board;
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.bezierCurveTo(x + length / 3, gy + 1.5, x + (2 * length) / 3, gy - 1.5, x + length, gy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(80, 45, 20, 0.35)";
      for (const nx of [x + 7, x + length - 9]) {
        ctx.fillRect(nx, y + board * 0.3, 2, 2);
        ctx.fillRect(nx, y + board * 0.68, 2, 2);
      }
      ctx.strokeStyle = "rgba(90, 50, 22, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, length - 1.5, board - 1.5);
    }
  }
});
