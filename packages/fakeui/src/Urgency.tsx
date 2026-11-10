// Urgency meter + sweat drop. The meter is a vertical tube with a stack of cells; the water level (0..1, continuous) fills the cells from the
// bottom and the top cell fills by the fractional part; peak turns the top cell to the alert color (at most one red per screen). Reads no frame
// number: the caller computes the level from time. cellsLit(level) tells the caller how many cells are lit (for one tick sound per cell).
import React from 'react';

import { defineObject } from '../../core/src/meta';
import { themed, THEME_PARAM, type FakeTheme } from './theme';

export const GAUGE_CELLS = 8;
export const cellsLit = (level: number, cells = GAUGE_CELLS) => Math.floor(Math.max(0, Math.min(1, level)) * cells + 1e-6);

type UrgencyGaugeProps = {
  /** Left edge in px. */
  x: number;
  /** Top edge in px. */
  y: number;
  /** Tube height in px. */
  h: number;
  /** Water level 0..1; the caller derives it from time. */
  level: number;
  /** Top cell turns the alert color. */
  peak?: boolean;
  /** Label above the tube; sized for a single character. */
  label?: string;
  /** Tube width in px. */
  w?: number;
  z?: number;
  cells?: number;
  opacity?: number;
  theme?: Partial<FakeTheme>;
};

export const UrgencyGauge: React.FC<UrgencyGaugeProps> = ({ x, y, h, level, peak, label = '!', w = 96, z = 20, cells = GAUGE_CELLS, opacity, theme }) => {
  const t = themed(theme);
  const gap = Math.max(4, w / 12);
  const ch = (h - gap * (cells + 1)) / cells;
  const lv = Math.max(0, Math.min(1, level)) * cells;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, zIndex: z, opacity }}>
      <div style={{ fontFamily: t.fontDisplay, fontSize: w * 0.6, color: t.ink, textAlign: 'center', lineHeight: 1, marginBottom: 12 }}>{label}</div>
      <div style={{ position: 'relative', width: w, height: h, boxSizing: 'border-box', border: `5px solid ${t.ink}`, background: t.card, boxShadow: `8px 8px 0 ${t.field}` }}>
        {Array.from({ length: cells }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, lv - i)); // how full cell i (0 = bottom) is
          const top = peak && i === cells - 1;
          return (
            <div key={i} style={{ position: 'absolute', left: gap, right: gap, bottom: gap + i * (ch + gap), height: ch, background: t.ruleSoft, opacity: 0.6 + 0.4 * Math.max(fill, top ? 1 : 0) }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(top ? 1 : fill) * 100}%`, background: top ? t.wrong : t.field }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Sweat drop (outlined water drop); drip 0..1 slides it down a little. */
export const Sweat: React.FC<{ x: number; y: number; s?: number; rot?: number; drip?: number; opacity?: number; z?: number; theme?: Partial<FakeTheme> }> = ({ x, y, s = 40, rot = 0, drip = 0, opacity = 1, z = 30, theme }) => {
  const t = themed(theme);
  return (
    <svg width={s} height={s * 1.4} viewBox="0 0 40 56" style={{ position: 'absolute', left: x, top: y + drip * s * 0.5, transform: `rotate(${rot}deg)`, overflow: 'visible', zIndex: z, opacity }}>
      <path d="M20 3 C 26 16 36 26 36 38 C 36 48 29 54 20 54 C 11 54 4 48 4 38 C 4 26 14 16 20 3 Z" fill={t.card} stroke={t.field} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M12 38 C 12 32 15 28 17 26" fill="none" stroke={t.field} strokeWidth={3.5} strokeLinecap="round" />
    </svg>
  );
};

export const meta = defineObject({
  name: 'UrgencyGauge',
  route: 'fakeui',
  package: 'fakeui',
  export: 'UrgencyGauge',
  summary: 'Vertical cell meter for "how urgent" with a continuous water level and an alert-colored top cell. Also exports Sweat (drop) and cellsLit(level).',
  params: [
    { name: 'x', type: 'number (px)' },
    { name: 'y', type: 'number (px)' },
    { name: 'h', type: 'number (px)', note: 'Tube height.' },
    { name: 'level', type: 'number 0..1', note: 'Water level; the top cell fills by the fractional part.' },
    { name: 'peak', type: 'boolean', note: 'Top cell turns the alert color.' },
    { name: 'label', type: 'string', default: '!', note: 'Label above the tube, sized for one character.' },
    { name: 'w', type: 'number (px)', default: 96 },
    { name: 'z', type: 'number', default: 20 },
    { name: 'cells', type: 'number', default: 8 },
    { name: 'opacity', type: 'number' },
    THEME_PARAM,
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [{ label: 'Meter at 60% with a sweat drop', comp: 'UrgencyGauge' }],
  status: 'stable',
});
