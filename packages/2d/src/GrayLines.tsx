import React from 'react';
import { defineObject } from '../../core/src/meta';

type Common = { n: number; h?: number; gap?: number; color?: string };
type PercentProps = Common & { seed?: number; min?: number; w?: undefined; prog?: undefined };
type PixelProps = Common & { w: number; prog?: number; seed?: undefined; min?: undefined };

/**
 * Placeholder lines that say "there is text here" without asking anyone to read it.
 * Without `w`, each line gets a seeded percentage width.
 * With `w`, lines unroll from the left one after another as `prog` goes from 0 to 1.
 */
export const GrayLines: React.FC<PercentProps | PixelProps> = (p) => (p.w === undefined ? <PercentLines {...p} /> : <PixelLines {...p} />);

const PercentLines: React.FC<PercentProps> = ({ n, seed = 1, color = '#D9D9D9', h = 10, gap = 12, min = 45 }) => (
  <>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} style={{ height: h, width: `${min + (((i + 1) * 37 * (seed + 2)) % (100 - min))}%`, background: color, marginTop: i ? gap : 0 }} />
    ))}
  </>
);

const PixelLines: React.FC<PixelProps> = ({ n, w, prog = 1, h = 10, gap = 14, color = '#D9D9D9' }) => (
  <div>
    {Array.from({ length: n }).map((_, i) => {
      const k = Math.max(0, Math.min(1, prog * n - i));
      return <div key={i} style={{ height: h, width: w * (0.55 + ((i * 37) % 40) / 100) * k, background: color, marginTop: i ? gap : 0 }} />;
    })}
  </div>
);

export const meta = defineObject({
  name: 'GrayLines',
  route: '2d',
  package: '2d',
  export: 'GrayLines',
  summary: 'Placeholder lines that say "there is text here" without asking anyone to read it. Percent widths, or unrolling pixel widths when w is given.',
  params: [
    { name: 'n', type: 'number', note: 'Number of lines.' },
    { name: 'h', type: 'number (px)', default: 10, note: 'Line height.' },
    { name: 'gap', type: 'number (px)', default: 12, note: 'Space between lines. Default is 14 when w is given.' },
    { name: 'color', type: 'string', default: '#D9D9D9' },
    { name: 'seed', type: 'number', default: 1, note: 'Percent mode only.' },
    { name: 'min', type: 'number (%)', default: 45, note: 'Percent mode only: minimum line width.' },
    { name: 'w', type: 'number (px)', note: 'Switches to pixel mode: lines unroll from the left.' },
    { name: 'prog', type: 'number (0..1)', default: 1, note: 'Pixel mode only: unroll progress.' },
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [],
  status: 'stable',
});
