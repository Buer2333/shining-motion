export * from './geom';
export * from './homography';
export * from './random';
export * from './frame';
export * from './meta';
// ease.ts is the pure curve set on t in [0, 1]. Its easeOut / easeInOut / clamp names are already taken by the
// frame-based versions in geom.ts, so the index exposes them under a T suffix; import './ease' directly for the plain names.
export { easeIn } from './ease';
export { clamp as clampTo, easeOut as easeOutT, easeInOut as easeInOutT } from './ease';
