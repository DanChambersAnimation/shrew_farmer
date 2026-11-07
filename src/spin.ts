const TAU = Math.PI * 2;

/** Advance an angle by `speed` radians/second over `dt` seconds, wrapped to [0, 2π). */
export function spin(angle: number, dt: number, speed: number): number {
  const next = (angle + speed * dt) % TAU;
  return next < 0 ? next + TAU : next;
}
