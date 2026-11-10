import React, { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import * as THREE from 'three';
import { DeckLive, distFor, layerZ, makeCam, unprojectAt, useDeckTextures, type LiveCard } from '../../packages/three/src/DeckLive';

// Nine procedural card faces (no image files): a tint per layer, a frame, a big number.
const useFaces = () =>
  useMemo(
    () =>
      Array.from({ length: 9 }, (_, k) => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const g = c.getContext('2d')!;
        g.fillStyle = `hsl(${k * 40}, 55%, 78%)`;
        g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#333';
        g.lineWidth = 8;
        g.strokeRect(4, 4, 248, 248);
        g.fillStyle = '#333';
        g.font = 'bold 140px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(String(k + 1), 128, 136);
        return c.toDataURL('image/png');
      }),
    [],
  );

const stack = (gap: number): LiveCard[] =>
  Array.from({ length: 9 }, (_, k) => ({ k, opacity: 1, edge: 1, pos: [0, 0, layerZ(k, gap)] as [number, number, number], quat: new THREE.Quaternion() }));

/** Follow-canvas placement: the canvas is shifted so the deck center lands at (cx, cy). Typical side-view values. */
export const DeckLiveSample: React.FC = () => {
  const tex = useDeckTextures(useFaces());
  if (!tex) return null;
  return (
    <AbsoluteFill style={{ background: '#f4f4f4' }}>
      <DeckLive tex={tex} cam={{ az: 34, el: 10, dist: 9.6 }} cards={stack(0.36)} cx={1450} cy={560} />
    </AbsoluteFill>
  );
};

/** Full-screen placement: camera view offset shifts the deck; the first card is shown mid-flight from a screen position. */
export const DeckLiveFullscreenSample: React.FC = () => {
  const tex = useDeckTextures(useFaces());
  if (!tex) return null;
  const cam = { az: 44, el: 9, dist: 9.9, cx: 1380, cy: 500 };
  const c = makeCam(cam);
  const cards = stack(0.5).slice(0, 8);
  const p0 = unprojectAt(c, 300, 300, distFor(200));
  cards.push({ k: 8, opacity: 1, edge: 0.5, pos: p0, quat: c.quaternion.clone() });
  return (
    <AbsoluteFill style={{ background: '#f4f4f4' }}>
      <DeckLive tex={tex} cam={cam} cards={cards} />
    </AbsoluteFill>
  );
};
