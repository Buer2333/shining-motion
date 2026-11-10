// Light: one beam (white or single color) + a seven-color spectrum band. A band goes continuously between "bundled" and "fanned out".
// Pure SVG, no three.js. Sizes follow the composition (portrait or landscape). Everything is computed by the caller from useCurrentFrame() and passed in; no clock here.
import React from 'react';
import { useVideoConfig } from 'remotion';

import { defineObject } from '../../core/src/meta';

/** Default seven spectrum colors: red, orange, yellow, green, cyan, blue, violet. Pass your own to SpectrumBand via `spectrum`. */
export const DEFAULT_SPECTRUM = ['#E5484D', '#F28C28', '#F2D13A', '#3BB273', '#2BB3E6', '#3B5BDB', '#7A4FE0'];
export const SPECTRUM = DEFAULT_SPECTRUM;
export const LIGHT_WHITE = '#FFFFFF';

type P = [number, number];
const at = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** One beam from `from` to `to`; grow = fraction grown out from `from` (0..1); color defaults to white light; glow = outer halo strength. */
export const LightBeam: React.FC<{ from: P; to: P; w?: number; grow?: number; opacity?: number; color?: string; glow?: number; z?: number }> = ({ from, to, w = 22, grow = 1, opacity = 1, color = LIGHT_WHITE, glow = 0.35, z = 5 }) => {
  const { width, height } = useVideoConfig();
  if (grow <= 0 || opacity <= 0) return null;
  const end = at(from, to, Math.min(1, grow));
  const id = `lb-${Math.round(from[0])}-${Math.round(from[1])}-${Math.round(w)}`;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, zIndex: z, pointerEvents: 'none' }}>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={w * 0.45} /></filter>
      </defs>
      <line x1={from[0]} y1={from[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={w * 2.6} strokeLinecap="round" opacity={glow * opacity} filter={`url(#${id})`} />
      <line x1={from[0]} y1={from[1]} x2={end[0]} y2={end[1]} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={opacity} />
    </svg>
  );
};

/** A big soft cone of light: `apex` is the tip, it opens toward `to` with half-width `halfW` at `to`. */
export const LightCone: React.FC<{ apex: P; to: P; halfW: number; opacity?: number; z?: number }> = ({ apex, to, halfW, opacity = 0.16, z = 4 }) => {
  const { width, height } = useVideoConfig();
  if (opacity <= 0) return null;
  const dx = to[0] - apex[0];
  const dy = to[1] - apex[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const id = `lc-${Math.round(apex[0])}-${Math.round(apex[1])}`;
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, zIndex: z, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={id} x1={apex[0]} y1={apex[1]} x2={to[0]} y2={to[1]} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={LIGHT_WHITE} stopOpacity={opacity * 1.4} />
          <stop offset="1" stopColor={LIGHT_WHITE} stopOpacity={opacity * 0.6} />
        </linearGradient>
      </defs>
      <path d={`M${apex[0] - nx * 18} ${apex[1] - ny * 18} L${apex[0] + nx * 18} ${apex[1] + ny * 18} L${to[0] + nx * halfW} ${to[1] + ny * halfW} L${to[0] - nx * halfW} ${to[1] - ny * halfW} Z`} fill={`url(#${id})`} />
    </svg>
  );
};

/**
 * Seven-color band from `origin` toward `dir` (radians), `len` x grow long.
 * bw = total width at the start; spread = total fan angle of the seven colors (0 = thin parallel band, > 0 = fanned out); one component goes from bundled to fanned and back.
 * lit[i] = brightness of stripe i (0..1, default all on): dim one stripe when peeling that color off.
 * spectrum = the stripe colors (default DEFAULT_SPECTRUM); its length sets the stripe count.
 */
export const SpectrumBand: React.FC<{ origin: P; dir: number; len: number; bw?: number; spread?: number; grow?: number; opacity?: number; lit?: number[]; z?: number; spectrum?: string[] }> = ({ origin, dir, len, bw = 42, spread = 0, grow = 1, opacity = 0.92, lit, z = 6, spectrum = DEFAULT_SPECTRUM }) => {
  const { width, height } = useVideoConfig();
  if (grow <= 0 || opacity <= 0) return null;
  const n = spectrum.length;
  const h0 = bw / n / 2;
  const step = spread / n;
  const L = len * Math.min(1, grow);
  const px = -Math.sin(dir);
  const py = Math.cos(dir);
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, zIndex: z, pointerEvents: 'none' }}>
      {spectrum.map((c, i) => {
        const k = i - (n - 1) / 2;
        const sx = origin[0] + px * k * h0 * 2;
        const sy = origin[1] + py * k * h0 * 2;
        const a = dir + k * step;
        const ex = sx + L * Math.cos(a);
        const ey = sy + L * Math.sin(a);
        const h1 = h0 + (L * Math.tan(Math.abs(step) / 2 || 0));
        const qx = -Math.sin(a);
        const qy = Math.cos(a);
        const d = `M${sx - px * h0} ${sy - py * h0} L${sx + px * h0} ${sy + py * h0} L${ex + qx * h1} ${ey + qy * h1} L${ex - qx * h1} ${ey - qy * h1} Z`;
        return <path key={i} d={d} fill={c} opacity={opacity * (lit ? lit[i] ?? 1 : 1)} />;
      })}
    </svg>
  );
};

export const meta = defineObject({
  name: 'LightBeam',
  route: '2d',
  package: '2d',
  export: 'LightBeam',
  summary: 'A beam of light (white or one color) that grows from a point, with a soft glow. Also exports LightCone (big soft cone) and SpectrumBand (seven-color band that goes from bundled to fanned out).',
  params: [
    { name: 'from', type: '[number, number] (px)', note: 'Start point.' },
    { name: 'to', type: '[number, number] (px)', note: 'End point.' },
    { name: 'w', type: 'number (px)', default: 22, note: 'Beam width.' },
    { name: 'grow', type: 'number 0..1', default: 1, note: 'Fraction grown out from `from`.' },
    { name: 'opacity', type: 'number 0..1', default: 1 },
    { name: 'color', type: 'string (CSS color)', default: '#FFFFFF' },
    { name: 'glow', type: 'number', default: 0.35, note: 'Outer halo strength.' },
    { name: 'z', type: 'number', default: 5 },
  ],
  events: [],
  presets: {},
  usedIn: ['NO.07'],
  samples: [{ label: 'Cone, beam and a fanned spectrum band', comp: 'LightBeam' }],
  status: 'stable',
});
