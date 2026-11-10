// Multi-pass WebGL2 as a Remotion component: one canvas, N fragment-shader passes run in order, the last one lands on screen.
// Uniforms come from the current frame, so the same frame renders the same pixels. Render with chromium gl=angle.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';

import { defineObject } from '../../core/src/meta';
import { makeRig, type PassSpec, type Rig, type Uni } from './gl';

type GLPassesProps = {
  /** Passes in run order. Keep the array stable between renders: the GL program is built once. */
  passes: PassSpec[];
  /** Uniforms, or a function of the current frame. */
  uniforms?: Uni | ((frame: number) => Uni);
  /** External textures by name (those named in some pass's `inputs`), uploaded before every draw. */
  textures?: Record<string, TexImageSource>;
  /** Canvas size in px. Default: composition size. */
  width?: number;
  height?: number;
};

export const GLPasses: React.FC<GLPassesProps> = ({ passes, uniforms, textures, width, height }) => {
  const frame = useCurrentFrame();
  const cfg = useVideoConfig();
  const W = width ?? cfg.width;
  const H = height ?? cfg.height;
  const ref = useRef<HTMLCanvasElement>(null);
  const rig = useRef<Rig | null>(null);
  const [hold] = useState(() => delayRender('gl-passes', { timeoutInMilliseconds: 60000 }));
  useLayoutEffect(() => {
    if (!rig.current) rig.current = makeRig(ref.current!, passes);
    for (const [name, src] of Object.entries(textures ?? {})) rig.current.setTexture(name, src);
    rig.current.draw(typeof uniforms === 'function' ? uniforms(frame) : (uniforms ?? {}));
    continueRender(hold);
  });
  useLayoutEffect(() => () => rig.current?.lose(), []);
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />;
};

export const meta = defineObject({
  name: 'GLPasses',
  route: 'gl',
  package: 'gl',
  export: 'GLPasses',
  summary: 'Generic multi-pass WebGL2 runner: fragment-shader passes in order, a pass can read earlier passes as sampler uniforms, the last pass is drawn to the canvas. No built-in scene.',
  params: [
    { name: 'passes', type: 'PassSpec[]', note: 'Each: { id?, fs, inputs?: { samplerUniform: passId | textureName }, scale?, float? }. Run in array order; inputs read earlier passes only.' },
    { name: 'uniforms', type: 'Uni | (frame: number) => Uni', default: {}, note: 'Float / int ("i" prefix) / vec2-4 by array length; "v3", "v4", "f1" name prefixes force vec3, vec4, float array. Every pass also gets uRes.' },
    { name: 'textures', type: 'Record<string, TexImageSource>', note: 'External textures by name, uploaded before every draw.' },
    { name: 'width', type: 'number (px)', default: 'composition width' },
    { name: 'height', type: 'number (px)', default: 'composition height' },
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [{ label: 'Two passes: gradient, then a wobbling pixelate of it', comp: 'GLPasses' }],
  status: 'experimental',
});
