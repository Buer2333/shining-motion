import React from 'react';

import { hash as seeded } from '../../core/src/random';
import { defineObject } from '../../core/src/meta';

// Same values as the old local hash(i, k): core's hash takes (seed, i).
const hash = (i: number, k: number) => seeded(k, i);

type DustProps = {
  w: number;
  h: number;
  /** Number of specks. */
  n: number;
  seed?: number;
  /** Radius is 0.6 + random × rSpan. */
  rSpan?: number;
  /** Opacity is op[0] + random × op[1]. */
  op?: [number, number];
  colors?: [string, string];
  /** Pass the current frame to make the specks drift. Leave it out for a still field. */
  f?: number;
};

/** A field of faint specks for dark backgrounds. Same seed, same field, on every render. */
export const Dust: React.FC<DustProps> = ({ w, h, n, seed = 191, rSpan = 1.3, op = [0.06, 0.18], colors = ['#FFF7E9', '#6F80FF'], f }) => (
  <svg width={w} height={h} style={{ position: 'absolute', left: 0, top: 0 }}>
    {Array.from({ length: n }).map((_, i) => (
      <circle
        key={i}
        cx={hash(i, seed) * w + (f === undefined ? 0 : Math.sin(f / 40 + i) * 4)}
        cy={hash(i, seed + 1) * h + (f === undefined ? 0 : Math.cos(f / 50 + i) * 4)}
        r={0.6 + hash(i, seed + 2) * rSpan}
        fill={hash(i, seed + 3) < 0.5 ? colors[0] : colors[1]}
        opacity={op[0] + hash(i, seed + 4) * op[1]}
      />
    ))}
  </svg>
);

export const meta = defineObject({
  name: 'Dust',
  route: '2d',
  package: '2d',
  export: 'Dust',
  summary: 'A field of faint specks for dark backgrounds. Same seed, same field, on every render.',
  params: [
    { name: 'w', type: 'number (px)', note: 'Field width.' },
    { name: 'h', type: 'number (px)', note: 'Field height.' },
    { name: 'n', type: 'number', note: 'Number of specks.' },
    { name: 'seed', type: 'number', default: 191 },
    { name: 'rSpan', type: 'number', default: 1.3, note: 'Radius is 0.6 + random x rSpan.' },
    { name: 'op', type: '[number, number]', default: [0.06, 0.18], note: 'Opacity is op[0] + random x op[1].' },
    { name: 'colors', type: '[string, string]', default: ['#FFF7E9', '#6F80FF'], note: 'Two speck colors, picked at random.' },
    { name: 'f', type: 'number (current frame)', note: 'Pass the current frame to make the specks drift. Leave it out for a still field.' },
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [],
  status: 'stable',
});
