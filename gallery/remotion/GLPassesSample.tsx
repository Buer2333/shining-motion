import React from 'react';
import { GLPasses } from '../../packages/gl/src/GLPasses';
import type { PassSpec } from '../../packages/gl/src/gl';

// --- Test shaders (used by packages/gl/tests/render_check.mjs) ---
const CONST_RED = `out vec4 o; void main(){ o = vec4(1., 0., 0., 1.); }`;
const CONST_BLUEISH = `out vec4 o; void main(){ o = vec4(64./255., 128./255., 192./255., 1.); }`;
const INVERT_PREV = `uniform sampler2D uPrev; uniform vec2 uRes; out vec4 o;
void main(){ vec3 c = texture(uPrev, gl_FragCoord.xy / uRes).rgb; o = vec4(1. - c, 1.); }`;

const SOLID: PassSpec[] = [{ fs: CONST_RED }];
const TWO_PASS: PassSpec[] = [{ id: 'base', fs: CONST_BLUEISH }, { id: 'inv', fs: INVERT_PREV, inputs: { uPrev: 'base' } }];
// the same two pass definitions in the opposite order: the inverting pass now reads a pass that has not run yet
const REVERSED: PassSpec[] = [TWO_PASS[1], TWO_PASS[0]];

export const GLSolid: React.FC = () => <GLPasses passes={SOLID} />;
export const GLTwoPass: React.FC = () => <GLPasses passes={TWO_PASS} />;
export const GLReversed: React.FC = () => <GLPasses passes={REVERSED} />;

// --- Gallery sample: pass 1 paints a gradient with a moving disc, pass 2 pixelates it with a wobble ---
const SCENE = `uniform float uT; uniform vec2 uRes; out vec4 o;
void main(){
  vec2 p = gl_FragCoord.xy / uRes;
  vec3 c = mix(vec3(.08,.1,.2), vec3(.9,.5,.3), p.y) * (.6 + .4 * p.x);
  vec2 d = p - vec2(.5 + .25 * sin(uT), .5 + .2 * cos(uT * 1.3));
  c = mix(c, vec3(1.), smoothstep(.12, .11, length(d * vec2(uRes.x / uRes.y, 1.))));
  o = vec4(c, 1.);
}`;
const PIXELATE = `uniform sampler2D uScene; uniform float uT; uniform vec2 uRes; out vec4 o;
void main(){
  vec2 p = gl_FragCoord.xy / uRes;
  float cells = 64.;
  vec2 q = (floor(p * cells) + .5) / cells;
  q += .004 * vec2(sin(q.y * 40. + uT * 3.), 0.);
  o = vec4(texture(uScene, q).rgb, 1.);
}`;
const DEMO: PassSpec[] = [{ id: 'scene', fs: SCENE }, { fs: PIXELATE, inputs: { uScene: 'scene' } }];
const demoUniforms = (f: number) => ({ uT: f / 30 });

export const GLPassesSample: React.FC = () => <GLPasses passes={DEMO} uniforms={demoUniforms} />;
