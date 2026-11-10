/** Linear interpolation from a to b. */
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Clamp v into [lo, hi]. */
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Easing curves on t in [0, 1]. Input is clamped, output stays in [0, 1]. */
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => {
  const k = clamp(t);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
