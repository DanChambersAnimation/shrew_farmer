import { textures } from "./library.ts";

/** Daytime sky through a window: pale blue at the top, brighter near the horizon. */
textures.register("sky-day", (ctx, size) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#b9d8f2");
  gradient.addColorStop(0.7, "#e4f0fa");
  gradient.addColorStop(1, "#f4f8fb");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  // A couple of soft clouds.
  for (const [x, y, r] of [
    [0.25, 0.25, 0.12],
    [0.7, 0.4, 0.09],
  ] as const) {
    const cloud = ctx.createRadialGradient(x * size, y * size, 0, x * size, y * size, r * size);
    cloud.addColorStop(0, "rgba(255,255,255,0.7)");
    cloud.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, size, size);
  }
});

/**
 * Night through a window: a dark sky, and the orange glow of a sodium
 * streetlight outside, with its lamp head bright at the centre of the glow.
 */
textures.register("sky-night", (ctx, size) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#05070f");
  gradient.addColorStop(1, "#141420");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const [x, y] = [0.5 * size, 0.42 * size];
  const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.42);
  glow.addColorStop(0, "rgba(255, 170, 70, 0.95)");
  glow.addColorStop(0.25, "rgba(255, 130, 40, 0.45)");
  glow.addColorStop(1, "rgba(255, 110, 30, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  // Lamp head and post.
  ctx.fillStyle = "#fff1c8";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.035, size * 0.015, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(10, 10, 14, 0.9)";
  ctx.fillRect(x - size * 0.006, y + size * 0.015, size * 0.012, size);
});
