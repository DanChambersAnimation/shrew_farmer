import { textures } from "./library.ts";

/** A cheerful cartoon face on red: big eyes and a wide smile (e.g. for a vacuum). */
textures.register("smiling-face", (ctx, size) => {
  ctx.fillStyle = "#d2232a";
  ctx.fillRect(0, 0, size, size);
  const eye = (x: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(x * size, 0.36 * size, 0.1 * size, 0.13 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc(x * size + 0.02 * size, 0.38 * size, 0.055 * size, 0, Math.PI * 2);
    ctx.fill();
  };
  eye(0.33);
  eye(0.67);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = size * 0.05;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0.5 * size, 0.5 * size, 0.27 * size, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
});
