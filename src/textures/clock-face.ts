import { textures } from "./library.ts";

/** A plain school-clock face: white, with hour marks and numbers. */
textures.register("clock-face", (ctx, size) => {
  const c = size / 2;
  ctx.fillStyle = "#fbfaf6";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#1a1a1a";
  ctx.fillStyle = "#1a1a1a";
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const [r0, r1] = [c * (major ? 0.8 : 0.86), c * 0.92];
    ctx.lineWidth = major ? size * 0.018 : size * 0.006;
    ctx.beginPath();
    ctx.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0);
    ctx.lineTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
    ctx.stroke();
  }
  ctx.font = `bold ${Math.round(size * 0.1)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2;
    ctx.fillText(String(n), c + Math.sin(a) * c * 0.64, c - Math.cos(a) * c * 0.64);
  }
});
