// Beat-locked cut vocabulary: a camera "view box", a cut table, windows, tri-windows and impact hits, all driven by one frame number.
// A cut is a jump inside a single frame (a frame-difference gate counts cuts as local maxima, so eased changes would be merged or missed); every
// action lands exactly at its `at` frame and only monotone decaying aftershocks follow. The component reads no clock: the caller passes the
// frame `f` and a cut table; `draw(view)` paints a whole W x H scene, and this component handles framing, windows, three-up grids and impact.
import React from 'react';

import { defineObject } from '../../core/src/meta';
import type { Rect, XY } from '../../core/src/geom';
import { themed, THEME_PARAM, type FakeTheme } from './theme';

// -- Framing: put `focus` of the full W x H scene at the center of the box, scaled by zoom; always covers the box (no bare edges) --
export type Cam = { focus: XY; zoom: number };
export const ViewBox: React.FC<{ rect: Rect; W: number; H: number; cam: Cam; children: React.ReactNode }> = ({ rect, W, H, cam, children }) => {
  const z = Math.max(cam.zoom, rect.w / W, rect.h / H);
  const tx = Math.min(0, Math.max(rect.w - W * z, rect.w / 2 - cam.focus.x * z));
  const ty = Math.min(0, Math.max(rect.h - H * z, rect.h / 2 - cam.focus.y * z));
  return (
    <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>{children}</div>
    </div>
  );
};

// -- Cut table --
// full: change the base scene (one framing for the whole screen; hard push = same scene at a bigger zoom) · hit = impact (scale punch) · move = slow push / pull inside a hold (from `at`, `len` frames, to another framing)
// win: open a window (a rect pops into place over the current base; base = swap the base in the same frame, e.g. back to the wide shot when the window would slice a pushed-in head) · swap: change the window content (window stays) · fill: window grows to full screen (its framing becomes the base)
// tri: tri-window (several cells appear in the same frame; base as for win) · rot: the cells change content in the same frame
export type ReelCut<V> =
  | { at: number; k: 'full'; view: V; hit?: boolean; move?: { at: number; len: number; view: V } }
  | { at: number; k: 'win'; rect: Rect; view: V; base?: V }
  | { at: number; k: 'swap'; view: V }
  | { at: number; k: 'fill'; hit?: boolean }
  | { at: number; k: 'tri'; rects: Rect[]; views: V[]; base?: V }
  | { at: number; k: 'rot'; views: V[] };
export type ReelState<V> = {
  base: { view: V; at: number; move?: { at: number; len: number; view: V } };
  hitAt: number;
  win?: { rect: Rect; view: V; at: number; swapAt: number };
  tri?: { rects: Rect[]; views: V[]; at: number; rotAt: number };
};
/** Replay the cut table up to frame f (cuts sorted by `at`; the first cut must be `full`). */
export const reelAt = <V,>(cuts: ReelCut<V>[], f: number): ReelState<V> => {
  if (!cuts.length || cuts[0].k !== 'full') throw new Error('the first cut must be "full"');
  let st: ReelState<V> = { base: { view: cuts[0].view, at: cuts[0].at }, hitAt: -1e9 };
  for (const c of cuts) {
    if (c.at > f) break;
    if (c.k === 'full') st = { base: { view: c.view, at: c.at, move: c.move }, hitAt: c.hit ? c.at : st.hitAt };
    else if (c.k === 'win') st = { ...st, base: c.base !== undefined ? { view: c.base, at: c.at } : st.base, win: { rect: c.rect, view: c.view, at: c.at, swapAt: c.at }, tri: undefined };
    else if (c.k === 'swap') {
      if (!st.win) throw new Error(`swap@${c.at}: no window open`);
      st = { ...st, win: { ...st.win, view: c.view, swapAt: c.at } };
    } else if (c.k === 'fill') {
      if (!st.win) throw new Error(`fill@${c.at}: no window open`);
      st = { base: { view: st.win.view, at: c.at }, hitAt: c.hit === false ? st.hitAt : c.at };
    } else if (c.k === 'tri') {
      if (c.rects.length !== c.views.length) throw new Error(`tri@${c.at}: cell count differs from view count`);
      st = { ...st, base: c.base !== undefined ? { view: c.base, at: c.at } : st.base, tri: { rects: c.rects, views: c.views, at: c.at, rotAt: c.at }, win: undefined };
    } else if (c.k === 'rot') {
      if (!st.tri || st.tri.views.length !== c.views.length) throw new Error(`rot@${c.at}: no tri-window with the same cell count`);
      st = { ...st, tri: { ...st.tri, views: c.views, rotAt: c.at } };
    }
  }
  return st;
};
/** Every cut's frame (for self-checks and logs). */
export const cutFrames = <V,>(cuts: ReelCut<V>[]) => cuts.map((c) => c.at);

const lerpCam = (a: Cam, b: Cam, k: number): Cam => ({ focus: { x: a.focus.x + (b.focus.x - a.focus.x) * k, y: a.focus.y + (b.focus.y - a.focus.y) * k }, zoom: a.zoom + (b.zoom - a.zoom) * k });
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// -- Window frame: white edge + strong line + hard shadow; pop = frames since it appeared (92% at 0, in place within 2 frames, monotone so no second frame-diff peak) --
export const WinFrame: React.FC<{ rect: Rect; pop: number; border?: number; z?: number; theme?: Partial<FakeTheme>; children: React.ReactNode }> = ({ rect, pop, border = 10, z = 30, theme, children }) => {
  const t = themed(theme);
  const s = pop >= 2 ? 1 : [0.92, 0.975][Math.max(0, Math.floor(pop))];
  const b = border;
  return (
    <div style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: z, transform: `scale(${s})`, transformOrigin: '50% 50%' }}>
      <div style={{ position: 'absolute', left: -b, top: -b, width: rect.w + 2 * b, height: rect.h + 2 * b, background: '#FFFFFF', outline: `4px solid ${t.ink}`, boxShadow: `14px 14px 0 ${t.field}` }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: rect.w, height: rect.h, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

type CutReelProps<V> = {
  /** Cut table, sorted by `at`; the first cut must be `full`. */
  cuts: ReelCut<V>[];
  /** Current frame of the finished video. */
  f: number;
  /** Size of the scene `draw` paints, px. */
  W: number;
  H: number;
  /** Paint a whole W x H scene for a view. */
  draw: (v: V) => React.ReactNode;
  /** Focus and zoom of a view inside a box. */
  camOf: (v: V, rect: Rect) => Cam;
  /** Zoom added per frame while holding (default 0.0012 per frame, about 7% in 2 s). */
  drift?: number;
  /** Start zoom of an impact hit (decays over 6 frames). */
  punch?: number;
  theme?: Partial<FakeTheme>;
};

/** Whole reel: base scene (with slow push / drift) + window / tri-window + impact hit. */
export const CutReel = <V,>({ cuts, f, W, H, draw, camOf, drift = 0.0012, punch = 0.06, theme }: CutReelProps<V>) => {
  const st = reelAt(cuts, f);
  const full: Rect = { x: 0, y: 0, w: W, h: H };
  let cam = camOf(st.base.view, full);
  if (st.base.move) {
    const m = st.base.move;
    cam = lerpCam(cam, camOf(m.view, full), smooth((f - m.at) / Math.max(1, m.len)));
  }
  const since = f - st.base.at;
  cam = { ...cam, zoom: cam.zoom * (1 + drift * Math.min(since, 60)) };
  const dh = f - st.hitAt;
  const k = dh >= 0 && dh < 8 ? 1 + punch * Math.exp(-dh / 2) : 1;
  const winCam = (v: V, rect: Rect, at: number) => {
    const c = camOf(v, rect);
    return { ...c, zoom: c.zoom * (1 + drift * Math.min(f - at, 60)) };
  };
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transform: k !== 1 ? `scale(${k})` : undefined, transformOrigin: '50% 50%' }}>
        <ViewBox rect={full} W={W} H={H} cam={cam}>{draw(st.base.view)}</ViewBox>
        {st.win ? (
          <WinFrame rect={st.win.rect} pop={f - st.win.at} theme={theme}>
            <ViewBox rect={{ x: 0, y: 0, w: st.win.rect.w, h: st.win.rect.h }} W={W} H={H} cam={winCam(st.win.view, st.win.rect, st.win.swapAt)}>{draw(st.win.view)}</ViewBox>
          </WinFrame>
        ) : null}
        {st.tri
          ? st.tri.rects.map((r, i) => (
              <WinFrame key={i} rect={r} pop={f - st.tri!.at} z={30 + i} theme={theme}>
                <ViewBox rect={{ x: 0, y: 0, w: r.w, h: r.h }} W={W} H={H} cam={winCam(st.tri!.views[i], r, st.tri!.rotAt)}>{draw(st.tri!.views[i])}</ViewBox>
              </WinFrame>
            ))
          : null}
      </div>
    </div>
  );
};

// -- Sticker: a white outline + soft shadow for a cut-out sitting on a photo (SVG filter; mount one <StickerDefs /> per video, put `filter: stickerFilter()` on the cut-out's wrapper) --
// Alpha is binarized first (hair and soft edges do not leave a half-transparent white fog), then dilated by r px and filled; the shadow is the blurred dilation shifted down.
export const STICKER_ID = 'reel-sticker';
export const stickerFilter = (id = STICKER_ID) => `url(#${id})`;
export const StickerDefs: React.FC<{ id?: string; r?: number; color?: string; shadow?: { dy: number; blur: number; opacity: number }; shadowColor?: string; theme?: Partial<FakeTheme> }> = ({ id = STICKER_ID, r = 7, color = '#FFFFFF', shadow = { dy: 14, blur: 14, opacity: 0.38 }, shadowColor, theme }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <filter id={id} x="-15%" y="-10%" width="130%" height="125%" colorInterpolationFilters="sRGB">
        <feComponentTransfer in="SourceAlpha" result="bin">
          <feFuncA type="linear" slope={3} intercept={-0.6} />
        </feComponentTransfer>
        <feMorphology in="bin" operator="dilate" radius={r} result="dil" />
        <feGaussianBlur in="dil" stdDeviation={0.7} result="dilS" />
        <feFlood style={{ floodColor: color }} result="c" />
        <feComposite in="c" in2="dilS" operator="in" result="outline" />
        <feGaussianBlur in="dil" stdDeviation={shadow.blur} result="sb" />
        <feOffset in="sb" dx={0} dy={shadow.dy} result="so" />
        <feFlood style={{ floodColor: shadowColor ?? themed(theme).ink, floodOpacity: shadow.opacity }} result="sc" />
        <feComposite in="sc" in2="so" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="outline" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

export const meta = defineObject({
  name: 'CutReel',
  route: 'fakeui',
  package: 'fakeui',
  export: 'CutReel',
  summary: 'Beat-locked cut vocabulary: base scene with hard pushes and slow drift, pop-in windows, three-up grids, impact hits, all from one frame number and a cut table. Also exports ViewBox, WinFrame, reelAt, StickerDefs.',
  params: [
    { name: 'cuts', type: 'ReelCut<V>[]', note: 'Cut table sorted by `at` (finished-video frames); kinds: full, win, swap, fill, tri, rot. The first cut must be full.' },
    { name: 'f', type: 'number (current frame)', note: 'Frame of the finished video.' },
    { name: 'W', type: 'number (px)', note: 'Width of the scene draw() paints.' },
    { name: 'H', type: 'number (px)', note: 'Height of the scene draw() paints.' },
    { name: 'draw', type: '(view: V) => ReactNode', note: 'Paints a whole W x H scene for a view.' },
    { name: 'camOf', type: '(view: V, rect: Rect) => { focus: {x, y}, zoom }', note: 'Framing of a view inside a box.' },
    { name: 'drift', type: 'number', default: 0.0012, note: 'Zoom added per frame while holding.' },
    { name: 'punch', type: 'number', default: 0.06, note: 'Start zoom of an impact hit; decays over 6 frames.' },
    THEME_PARAM,
  ],
  events: ['f'],
  presets: {},
  usedIn: [],
  samples: [{ label: 'Hard push, a pop-in window, then a three-up grid', comp: 'CutReel' }],
  status: 'stable',
});
