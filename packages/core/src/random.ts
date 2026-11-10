/** Deterministic hash of (seed, i) into [0, 1). Same inputs, same output, on every machine and every render. */
export const hash = (seed: number, i: number): number => {
  const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Seeded generator: each call returns the next value in [0, 1). Two generators with the same seed produce the same sequence. */
export const rng = (seed: number): (() => number) => {
  let i = 0;
  return () => hash(seed, i++);
};
