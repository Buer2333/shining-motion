import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';
import { cacheKey } from './key';

export type BlenderSequenceProps = {
  /** Blender generator name, the middle part of the cache path. */
  object: string;
  /** Params the generator was run with. Their cacheKey picks the folder. */
  params: object;
  /** Cache root inside public/. */
  base?: string;
  /** Unused by the component itself; documents the fps the sequence was rendered at. */
  fps?: number;
  /** Frame of the composition where the sequence starts. */
  startFrom?: number;
  /** Zero-padding width of the file name. */
  digits?: number;
};

/** Plays a Blender frame sequence from public/<base>/<object>/<cacheKey(params)>/%04d.png, one image per composition frame. */
export const BlenderSequence: React.FC<BlenderSequenceProps> = ({ object, params, base = 'blender-cache', startFrom = 0, digits = 4 }) => {
  const frame = Math.max(0, useCurrentFrame() - startFrom);
  const name = String(frame).padStart(digits, '0');
  return <Img src={staticFile(`${base}/${object}/${cacheKey(params)}/${name}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};
