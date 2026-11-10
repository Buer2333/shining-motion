// Plan sheet: a line-art back-office card with a title bar and rows of "field | value | check". Fills the given w x h (can serve as the back of a flip sign).
// Reads no frame number. Per row: write (0..1, the value is written out character by character; unwritten characters keep their space so layout does not jump),
// check (0..1, the check mark is drawn in one stroke), hl (0..1, the lower half of the value is highlighted left to right; at most one highlight per screen),
// glint (0..1, a light streak sweeps across the value). The caller drives them from time.
import React from 'react';

import { defineObject } from '../../core/src/meta';
import { themed, THEME_PARAM, type FakeTheme } from './theme';

export type PlanRow = { k: string; v: string; write?: number; check?: number; hl?: number; glint?: number };

// A slanted light band that sweeps across the parent (parent needs position: relative).
const GlintBar: React.FC<{ progress: number }> = ({ progress }) =>
  progress <= 0 || progress >= 1 ? null : (
    <span
      style={{
        position: 'absolute',
        inset: '-10% -4%',
        zIndex: 3,
        pointerEvents: 'none',
        background: `linear-gradient(110deg, transparent ${progress * 140 - 30}%, rgba(255,255,255,0.95) ${progress * 140 - 20}%, transparent ${progress * 140 - 10}%)`,
        mixBlendMode: 'screen',
      }}
    />
  );

type PlanSheetProps = {
  w: number;
  h: number;
  title: string;
  rows: PlanRow[];
  /** Value font size; everything else scales from it. */
  px?: number;
  /** Title opacity 0..1. */
  titleIn?: number;
  /** Outer border width in px. */
  border?: number;
  theme?: Partial<FakeTheme>;
};

export const PlanSheet: React.FC<PlanSheetProps> = ({ w, h, title, rows, px = 48, titleIn = 1, border = 6, theme }) => {
  const t = themed(theme);
  const head = px * 1.5;
  const rowH = (h - head - border * 2 - px * 0.5) / Math.max(1, rows.length);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, boxSizing: 'border-box', background: t.card, border: `${border}px solid ${t.ink}`, overflow: 'hidden' }}>
      <div style={{ height: head, borderBottom: `3px solid ${t.rule}`, display: 'flex', alignItems: 'center', gap: px * 0.25, padding: `0 ${px * 0.5}px` }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: px * 0.3, height: px * 0.3, border: `3px solid ${t.rule}`, flex: 'none' }} />
        ))}
        <span style={{ marginLeft: px * 0.25, fontFamily: t.fontDisplay, fontSize: px * 0.95, color: t.ink, whiteSpace: 'nowrap', opacity: titleIn }}>{title}</span>
      </div>
      <div style={{ padding: `${px * 0.25}px ${px * 0.5}px` }}>
        {rows.map((r, i) => {
          const n = Math.round(Math.max(0, Math.min(1, r.write ?? 1)) * r.v.length);
          const shown = (r.write ?? 1) > 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: px * 0.4, height: rowH, borderBottom: i < rows.length - 1 ? `2px dashed ${t.ruleSoft}` : undefined, boxSizing: 'border-box' }}>
              <span style={{ width: px * 2.1, flex: 'none', fontFamily: t.fontMeta, fontWeight: 700, fontSize: px * 0.62, color: t.inkSoft, whiteSpace: 'nowrap', opacity: shown ? 1 : 0.35 }}>{r.k}</span>
              <span style={{ flex: 1, position: 'relative', fontFamily: t.fontBody, fontWeight: 900, fontSize: px, color: t.ink, whiteSpace: 'nowrap', lineHeight: 1.15 }}>
                {!shown ? <div style={{ position: 'absolute', left: 0, right: '18%', top: '40%', height: px * 0.28, background: t.ruleSoft }} /> : null}
                <span style={{ position: 'relative', display: 'inline-block' }}>
                  {(r.hl ?? 0) > 0 ? <span style={{ position: 'absolute', left: '-0.1em', top: '48%', bottom: '-6%', width: `calc(${Math.min(1, r.hl!) * 100}% + 0.2em)`, background: t.marker }} /> : null}
                  <span style={{ position: 'relative' }}>
                    {r.v.split('').map((ch, j) => (
                      <span key={j} style={{ opacity: j < n ? 1 : 0 }}>{ch}</span>
                    ))}
                  </span>
                  {(r.glint ?? 0) > 0 ? <GlintBar progress={r.glint!} /> : null}
                </span>
              </span>
              <div style={{ width: px * 0.9, height: px * 0.9, flex: 'none', border: `3px solid ${t.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(r.check ?? 0) > 0 ? (
                  <svg width={px * 0.8} height={px * 0.8} viewBox="0 0 36 36">
                    <path d="M5 19 L14 28 L31 8" fill="none" stroke={t.field} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${Math.min(1, r.check!)} 1`} />
                  </svg>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const meta = defineObject({
  name: 'PlanSheet',
  route: 'fakeui',
  package: 'fakeui',
  export: 'PlanSheet',
  summary: 'Line-art back-office sheet: title bar plus rows of field, value and check. Per-row write / check / highlight / glint progress, driven by the caller.',
  params: [
    { name: 'w', type: 'number (px)' },
    { name: 'h', type: 'number (px)' },
    { name: 'title', type: 'string' },
    { name: 'rows', type: 'PlanRow[]', note: '{ k, v, write?, check?, hl?, glint? }; the four progress values are 0..1.' },
    { name: 'px', type: 'number (px)', default: 48, note: 'Value font size; everything else scales from it.' },
    { name: 'titleIn', type: 'number 0..1', default: 1, note: 'Title opacity.' },
    { name: 'border', type: 'number (px)', default: 6 },
    THEME_PARAM,
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [{ label: 'Four rows, mid-write', comp: 'PlanSheet' }],
  status: 'stable',
});
