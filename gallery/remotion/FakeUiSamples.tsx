import React from 'react';
import { AbsoluteFill } from 'remotion';
import { CutReel, type Cam, type ReelCut } from '../../packages/fakeui/src/CutReel';
import { PlanSheet } from '../../packages/fakeui/src/PlanSheet';
import { SocialPost } from '../../packages/fakeui/src/SocialPost';
import { Terminal } from '../../packages/fakeui/src/Terminal';
import { Sweat, UrgencyGauge } from '../../packages/fakeui/src/Urgency';

const Page: React.FC<{ children: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ background: '#f4f4f4' }}>{children}</AbsoluteFill>;

export const TerminalSample: React.FC = () => (
  <Page>
    <Terminal
      x={90}
      y={500}
      w={900}
      h={620}
      px={40}
      title="build"
      at={0}
      lines={[
        { text: '$ npm run build', type: { at: 0, cps: 60 } },
        { text: 'compiling 128 modules', dim: true },
        { parts: [{ t: 'warning: ' }, { t: 'unused import', ul: { at: 0, dur: 20 } }, { t: ' in app.ts' }] },
        { text: 'function render(frame) {', dim: true },
        { text: 'return draw(frame)', indent: 2 },
        { text: '}', dim: true },
      ]}
    />
  </Page>
);

export const UrgencyGaugeSample: React.FC = () => (
  <Page>
    <UrgencyGauge x={440} y={500} h={640} level={0.6} label="!" />
    <Sweat x={600} y={470} s={60} rot={14} />
  </Page>
);

export const SocialPostSample: React.FC = () => (
  <Page>
    <SocialPost x={90} y={560} w={900} platform="Feed" nick="someone" date="03-14" text="Shipped the first version today" likes="1.2k" px={44} mediaH={300}>
      <div style={{ position: 'absolute', inset: 0, background: '#e5e7eb' }} />
    </SocialPost>
  </Page>
);

export const PlanSheetSample: React.FC = () => (
  <Page>
    <div style={{ position: 'absolute', left: 90, top: 520, width: 900, height: 760 }}>
      <PlanSheet
        w={900}
        h={760}
        title="Plan"
        px={44}
        rows={[
          { k: 'Name', v: 'Spring launch', write: 1, check: 1 },
          { k: 'Budget', v: '12,000', write: 1, check: 1, hl: 1 },
          { k: 'Region', v: 'North', write: 0.6, check: 0.5 },
          { k: 'Start', v: '03-01', write: 0 },
        ]}
      />
    </div>
  </Page>
);

type V = 'a' | 'b' | 'c';
const TINT: Record<V, string> = { a: '#cbd5e1', b: '#fecaca', c: '#bbf7d0' };
const draw = (v: V) => (
  <div style={{ width: 1080, height: 1920, background: TINT[v], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', fontSize: 400, fontWeight: 900, color: '#1a1a1a' }}>{v.toUpperCase()}</div>
);
const camOf = (v: V): Cam => ({ focus: { x: 540, y: 960 }, zoom: v === 'a' ? 1 : 1.3 });
const CUTS: ReelCut<V>[] = [
  { at: 0, k: 'full', view: 'a' },
  { at: 6, k: 'full', view: 'a', hit: true },
  { at: 12, k: 'win', rect: { x: 140, y: 420, w: 800, h: 560 }, view: 'b' },
  { at: 20, k: 'tri', rects: [{ x: 60, y: 1200, w: 300, h: 400 }, { x: 390, y: 1200, w: 300, h: 400 }, { x: 720, y: 1200, w: 300, h: 400 }], views: ['a', 'b', 'c'] },
];
export const CutReelSample: React.FC<{ f?: number }> = ({ f = 24 }) => <CutReel cuts={CUTS} f={f} W={1080} H={1920} draw={draw} camOf={camOf} />;
