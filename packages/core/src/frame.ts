/** 0..1 progress of `frame` over `len` frames starting at frame `at`. Clamped. */
export const progress = (frame: number, at: number, len: number): number => {
  const k = (frame - at) / Math.max(1, len);
  return k < 0 ? 0 : k > 1 ? 1 : k;
};

/** True once `frame` has reached the event frame `at`. */
export const frameEvent = (frame: number, at: number): boolean => frame >= at;
