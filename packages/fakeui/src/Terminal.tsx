// Dark terminal window (title bar with three dots + monospace code lines) that drops in like a sheet of paper onto the desk.
// Fragments inside a line can get a light underline drawn on a schedule; lines can type out character by character
// (characters not typed yet keep their space, so the layout does not jump). TermBlock is a small corner terminal (gray bars, no text);
// TermRows is a window of gray placeholder rows filled in by `prog`.
import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

import { clamp, easeOut } from '../../core/src/geom';
import { defineObject } from '../../core/src/meta';
import { themed, THEME_PARAM, type FakeTheme } from './theme';

/** Dim line color (context lines, function heads). */
export const TERM_DIM = 'rgba(255,255,255,0.42)';

/** Corner terminal block: title bar with three dots + `rows` gray bars (placeholder, no text). */
export const TermBlock: React.FC<{ w: number; h: number; rows?: number; theme?: Partial<FakeTheme> }> = ({ w, h, rows = 4, theme }) => {
  const t = themed(theme);
  return (
    <div style={{ width: w, height: h, background: t.code, borderRadius: 14, overflow: 'hidden', boxShadow: `6px 6px 0 ${t.field}` }}>
      <div style={{ height: 30, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.35)' }} />
        ))}
      </div>
      <div style={{ padding: '12px 14px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ height: 8, width: `${40 + ((i * 29) % 50)}%`, background: 'rgba(255,255,255,0.28)', marginBottom: 14, marginLeft: (i % 2) * 16 }} />
        ))}
      </div>
    </div>
  );
};

/** Terminal window with gray placeholder code rows; prog 0..1 = how many rows have been typed. With px, the bar is max(46, px x 1.5) tall and can carry a title. */
export const TermRows: React.FC<{ w: number; h: number; prog: number; rows?: number; title?: string; px?: number; theme?: Partial<FakeTheme> }> = ({ w, h, prog, rows = 8, title, px, theme }) => {
  const t = themed(theme);
  const bar = px === undefined ? 46 : Math.max(46, px * 1.5);
  const lh = (h - bar - 36) / rows;
  return (
    <div style={{ width: w, height: h, background: t.code, borderRadius: 16, overflow: 'hidden', boxShadow: `8px 8px 0 ${t.field}` }}>
      <div style={{ height: bar, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.35)', flex: 'none' }} />
        ))}
        {title ? <span style={{ marginLeft: 14, fontFamily: t.fontMeta, fontWeight: 700, fontSize: px, lineHeight: 1, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{title}</span> : null}
      </div>
      <div style={{ padding: '18px 24px' }}>
        {Array.from({ length: rows }).map((_, i) => {
          const k = Math.max(0, Math.min(1, prog * rows - i));
          const full = 0.32 + ((i * 37) % 55) / 100;
          return (
            <div key={i} style={{ height: lh, display: 'flex', alignItems: 'center', paddingLeft: (i % 3) * 28 }}>
              <div style={{ height: Math.min(12, lh * 0.34), width: `${full * k * 100}%`, background: 'rgba(255,255,255,0.3)' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Underline: starts at frame `at`, draws left to right over `dur` frames; `linear` = linear (relay across a run of fragments), otherwise ease-out. */
export type TermUnderline = { at: number; dur: number; linear?: boolean };
export type TermPart = { t: string; ul?: TermUnderline };
/**
 * One line: `text` (plain) or `parts` (segments that can each be underlined), one of the two. dim = dim color; indent = indent in units of the font size;
 * type = type it out from frame `at` at `cps` characters per second. Without `type` the whole line is there from the start.
 */
export type TermLine = { text?: string; parts?: TermPart[]; dim?: boolean; indent?: number; type?: { at: number; cps?: number } };

const typed = (frame: number, t: { at: number; cps?: number }) => Math.max(0, Math.floor(((frame - t.at) / 30) * (t.cps ?? 12)));
const Reveal: React.FC<{ s: string; n: number }> = ({ s, n }) => (
  <>
    {s.slice(0, n)}
    <span style={{ opacity: 0 }}>{s.slice(n)}</span>
  </>
);

// A sheet landing on the desk: falls, settles, the hard shadow tightens as it lands.
const Drop: React.FC<{ at: number; frames: number; tilt: number; children: React.ReactNode }> = ({ at, frames, tilt, children }) => {
  const frame = useCurrentFrame();
  const p = easeOut(frame, at, frames);
  return (
    <div style={{ opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * -40}px) rotate(${(1 - p) * tilt}deg)`, filter: p < 1 ? `drop-shadow(0 ${(1 - p) * 26}px ${(1 - p) * 18}px rgba(0,0,0,0.12))` : undefined }}>{children}</div>
  );
};

type TerminalProps = {
  /** Left edge in px. */
  x: number;
  /** Top edge in px. */
  y: number;
  w: number;
  h: number;
  /** Code font size in px. */
  px: number;
  /** Title bar text (32px). Omit for no title. */
  title?: string;
  lines: TermLine[];
  /** Frame at which the window appears and drops in. */
  at: number;
  /** Start rotation of the drop, degrees. */
  tilt?: number;
  /** Drop duration in frames. */
  dropFrames?: number;
  /** Text color of normal lines. Default theme.paper. */
  fg?: string;
  theme?: Partial<FakeTheme>;
};

export const Terminal: React.FC<TerminalProps> = ({ x, y, w, h, px, title, lines, at, tilt = -1.2, dropFrames = 11, fg, theme }) => {
  const frame = useCurrentFrame();
  const th = themed(theme);
  const FG = fg ?? th.paper;
  if (frame < at) return null;
  return (
    <div style={{ position: 'absolute', left: x, top: y }}>
      <Drop at={at} frames={dropFrames} tilt={tilt}>
        <div style={{ width: w, height: h, background: th.code, borderRadius: 16, overflow: 'hidden', boxShadow: `8px 8px 0 ${th.field}` }}>
          <div style={{ height: 54, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 20 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.35)' }} />
            ))}
            {title !== undefined ? <span style={{ marginLeft: 14, fontFamily: th.fontMeta, fontWeight: 700, fontSize: 32, lineHeight: 1, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{title}</span> : null}
          </div>
          <div style={{ padding: '18px 28px', fontFamily: th.fontMeta, fontWeight: 700, fontSize: px, lineHeight: 1.5, whiteSpace: 'pre' }}>
            {lines.map((ln, li) => {
              const n = ln.type ? typed(frame, ln.type) : Infinity;
              let used = 0;
              return (
                <div key={li} style={{ color: ln.dim ? TERM_DIM : FG, paddingLeft: ln.indent !== undefined ? px * ln.indent : undefined }}>
                  {ln.parts
                    ? ln.parts.map((p, i) => {
                        const from = used;
                        used += p.t.length;
                        const u = !p.ul ? 0 : p.ul.linear ? interpolate(frame, [p.ul.at, p.ul.at + p.ul.dur], [0, 1], clamp) : easeOut(frame, p.ul.at, p.ul.dur);
                        return (
                          <span key={i} style={{ position: 'relative' }}>
                            {ln.type ? <Reveal s={p.t} n={Math.max(0, n - from)} /> : p.t}
                            {u > 0 ? <span style={{ position: 'absolute', left: 0, bottom: -4, height: 5, width: `${u * 100}%`, background: FG }} /> : null}
                          </span>
                        );
                      })
                    : ln.type
                      ? <Reveal s={ln.text ?? ''} n={n} />
                      : ln.text}
                </div>
              );
            })}
          </div>
        </div>
      </Drop>
    </div>
  );
};

export const meta = defineObject({
  name: 'Terminal',
  route: 'fakeui',
  package: 'fakeui',
  export: 'Terminal',
  summary: 'Dark terminal window that drops in like paper; monospace lines can type out and get timed underlines. Also exports TermBlock (corner block) and TermRows (placeholder rows).',
  params: [
    { name: 'x', type: 'number (px)', note: 'Left edge.' },
    { name: 'y', type: 'number (px)', note: 'Top edge.' },
    { name: 'w', type: 'number (px)' },
    { name: 'h', type: 'number (px)' },
    { name: 'px', type: 'number (px)', note: 'Code font size.' },
    { name: 'title', type: 'string', note: 'Title bar text. Omit for none.' },
    { name: 'lines', type: 'TermLine[]', note: '{ text | parts: [{ t, ul?: { at, dur, linear? } }], dim?, indent?, type?: { at, cps? } }. `at` frames are in the finished video.' },
    { name: 'at', type: 'number (frame)', note: 'Frame the window appears and drops in.' },
    { name: 'tilt', type: 'number (deg)', default: -1.2, note: 'Start rotation of the drop.' },
    { name: 'dropFrames', type: 'number (frames)', default: 11, note: 'Drop duration.' },
    { name: 'fg', type: 'string (CSS color)', note: 'Text color of normal lines. Default theme.paper.' },
    THEME_PARAM,
  ],
  events: ['at'],
  presets: {},
  usedIn: [],
  samples: [{ label: 'Terminal with a typed line and timed underlines', comp: 'Terminal' }],
  status: 'stable',
});
