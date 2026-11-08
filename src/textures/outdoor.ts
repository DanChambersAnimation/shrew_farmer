import { Random } from "../core/random.ts";
import { textures } from "./library.ts";

/** Red brick in running bond, with pale mortar and varied brick tones. */
textures.register("brick", (ctx, size) => {
  ctx.fillStyle = "#cfc4b2"; // mortar
  ctx.fillRect(0, 0, size, size);
  const rng = new Random(21);
  const rows = 16;
  const course = size / rows;
  const brick = size / 4;
  const reds = ["#9c3b2a", "#a8432f", "#8f3526", "#b04a34", "#963d2c", "#a33f2c"];
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (brick / 2);
    for (let k = -1; k < 5; k++) {
      ctx.fillStyle = rng.pick(reds);
      ctx.fillRect(offset + k * brick + 2, r * course + 2, brick - 4, course - 4);
    }
  }
});

/** Grey paving slabs in a grid, slightly varied, with dark joints. */
textures.register("paving", (ctx, size) => {
  ctx.fillStyle = "#6f6f6c";
  ctx.fillRect(0, 0, size, size);
  const rng = new Random(9);
  const slabs = 4;
  const slab = size / slabs;
  for (let y = 0; y < slabs; y++) {
    for (let x = 0; x < slabs; x++) {
      const tone = 150 + Math.round(rng.next() * 25);
      ctx.fillStyle = `rgb(${tone}, ${tone}, ${tone - 6})`;
      ctx.fillRect(x * slab + 2, y * slab + 2, slab - 4, slab - 4);
    }
  }
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = rng.next() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
    ctx.fillRect(rng.next() * size, rng.next() * size, 2, 2);
  }
});

/** Lawn: mottled greens with short blade strokes. */
textures.register("grass", (ctx, size) => {
  ctx.fillStyle = "#4f7a35";
  ctx.fillRect(0, 0, size, size);
  const rng = new Random(13);
  const greens = ["#5b8a3c", "#466e2e", "#67954a", "#3f6428", "#72a052"];
  for (let i = 0; i < 6000; i++) {
    ctx.strokeStyle = rng.pick(greens);
    ctx.lineWidth = 1;
    const x = rng.next() * size;
    const y = rng.next() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng.next() - 0.5) * 3, y - 3 - rng.next() * 4);
    ctx.stroke();
  }
});
