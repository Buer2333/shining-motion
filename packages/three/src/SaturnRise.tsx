// A ringed planet with the sun hidden behind it: the opening frame is a ring of fire, the camera slowly dives and swings round,
// and over 2.5 s the sun comes out from the planet's edge in one burst. The planet lights up and the ring bands cast stripe shadows on it.
// The sun is a stack of gradient sprites (fake glow). With `bloom` on, a real UnrealBloom pass is added on top (needs a dark background).
// Remotion + three notes: <ThreeCanvas flat>; motion comes from useCurrentFrame only; render with gl=angle;
// three 0.186 has no PCFSoft shadow type, so shadow softness comes from shadow-radius.
import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

import { defineObject } from '../../core/src/meta';

const R_PLANET = 1;
const SUN_DIST = 30;
const SUN = new THREE.Vector3(0, 0, -SUN_DIST); // behind the planet; the opening camera is straight in front = an eclipse
const FOV = 38;
const BANDS = 34;

const rgba = (hex: string, a: number | string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

// Camera path: slow start over the first 2 s, fastest in the middle (the sun clears the edge around 2.5 s), eased end, no overshoot.
const camAt = (frame: number, aspect: number) => {
  const p = interpolate(frame, [0, 180], [0, 1], { easing: Easing.inOut(Easing.cubic) });
  const phi = interpolate(p, [0, 1], [0, 0.24]); // camera rises: the far sun sinks relative to the planet and clears its upper edge
  const alpha = interpolate(p, [0, 1], [0, 0.2]); // and swings a little right, so the ring sweeps by at a slant
  const r = interpolate(p, [0, 1], [8.6, 7.4]);
  const pos = new THREE.Vector3(r * Math.cos(phi) * Math.sin(alpha), r * Math.sin(phi), r * Math.cos(phi) * Math.cos(alpha));
  const target = new THREE.Vector3(0, interpolate(p, [0, 1], [0, 0.5]), 0); // look up so the planet sits in the lower half and the sun in the upper
  const cam = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 100);
  cam.position.copy(pos);
  cam.up.set(interpolate(p, [0, 1], [0, -0.22]), 1, 0).normalize(); // slight roll turns the bands into diagonals
  cam.lookAt(target);
  cam.updateMatrixWorld(true);
  return { cam, p };
};

const CamRig: React.FC<{ frame: number; aspect: number }> = ({ frame, aspect }) => {
  const { camera } = useThree();
  const { cam } = camAt(frame, aspect);
  camera.position.copy(cam.position);
  camera.quaternion.copy(cam.quaternion);
  camera.updateMatrixWorld(true);
  return null;
};

// Radial gradient texture in the sun color, alpha steps given as [offset, alpha].
const glowTex = (stops: [number, number][], color: string) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, a]) => grd.addColorStop(o, rgba(color, a)));
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// Ring: many thin bands; width, spacing and opacity come from random(), like the stripes of a real ring.
const ringBands = () =>
  Array.from({ length: BANDS }, (_, i) => {
    const r0 = 1.42 + (i / BANDS) * 1.05 + random(`ring-o-${i}`) * 0.012;
    const w = 0.008 + random(`ring-w-${i}`) * 0.022;
    const a = 0.3 + random(`ring-a-${i}`) * 0.6;
    return { geo: new THREE.RingGeometry(r0, r0 + w, 160, 1), a };
  });

// Bloom post pass: the composer renders in useFrame(priority 1) and takes over R3F's auto render; strength comes only from the current frame, so it is deterministic.
const BloomFx: React.FC<{ frame: number }> = ({ frame }) => {
  const { gl, scene, camera, size } = useThree();
  const burst = interpolate(frame, [68, 84, 112], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const comp = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(size.width, size.height, { type: THREE.HalfFloatType });
    const c = new EffectComposer(gl, rt);
    c.setPixelRatio(1);
    c.setSize(size.width, size.height);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 1, 0.6, 0.85));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, size.width, size.height]);
  useFrame(() => {
    const bp = comp.passes[1] as UnrealBloomPass;
    bp.strength = 0.9 + burst * 0.9;
    bp.radius = 0.7;
    bp.threshold = 0.6;
    comp.render(0);
  }, 1);
  void frame;
  return null;
};

type SaturnRiseProps = {
  /** Scene background. With bloom on use a dark color: bloom washes a light background out. */
  background?: string;
  planetColor?: string;
  /** Color of the ring bands. */
  ringColor?: string;
  /** Color of the sun glow sprites. */
  sunColor?: string;
  /** Add an UnrealBloom post pass. */
  bloom?: boolean;
};

export const SaturnRise: React.FC<SaturnRiseProps> = ({ background = '#05060a', planetColor = '#6b7280', ringColor = '#e5e7eb', sunColor = '#ffffff', bloom = false }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const aspect = width / height;
  const bands = useMemo(ringBands, []);
  const halo = useMemo(() => glowTex([[0, 1], [0.15, 0.85], [0.35, 0.38], [0.6, 0.1], [1, 0]], sunColor), [sunColor]);
  // Corona: a ring peaking at 0.6 radius. With the planet covering the center it is a ring of fire; once the camera moves it goes thick on one side and thin on the other.
  const corona = useMemo(() => glowTex([[0, 0], [0.5, 0], [0.58, 1], [0.64, 0.75], [0.76, 0.22], [1, 0]], sunColor), [sunColor]);
  const core = useMemo(() => glowTex([[0, 1], [0.35, 1], [0.6, 0.5], [1, 0]], sunColor), [sunColor]);

  // Burst: climbs to its peak as the bright core clears the planet edge (2.3-2.8 s), then falls back over about 0.9 s.
  const burst = interpolate(frame, [68, 84, 112], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  // Key light: starts straight behind (lights only the back), then swings to the camera side so more of the planet is lit (turns earlier than the sun sprite).
  const lit = interpolate(frame, [64, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const lightPos = new THREE.Vector3(interpolate(lit, [0, 1], [0, 6]), interpolate(lit, [0, 1], [0, -1.6]), interpolate(lit, [0, 1], [-10, 2.5]));
  const coronaA = interpolate(frame, [50, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <ThreeCanvas flat shadows="percentage" width={width} height={height} camera={{ fov: FOV, near: 0.1, far: 100, position: [0, 0, 8.6] }}>
        <CamRig frame={frame} aspect={aspect} />
        {bloom ? <BloomFx frame={frame} /> : null}
        <color attach="background" args={[background]} />
        <ambientLight intensity={0.45} />
        <directionalLight
          position={lightPos.toArray()}
          intensity={interpolate(lit, [0, 1], [1.2, 2.4]) + burst * 1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-radius={4}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />
        {/* Sun: big halo + bright core, all behind the planet, which covers the center = ring of fire */}
        <sprite position={SUN.toArray()} scale={[15, 15, 1]} renderOrder={0}>
          <spriteMaterial map={corona} transparent opacity={coronaA} depthWrite={false} />
        </sprite>
        <sprite position={SUN.toArray()} scale={[11 + burst * 14, 11 + burst * 14, 1]} renderOrder={1}>
          <spriteMaterial map={halo} transparent depthWrite={false} />
        </sprite>
        <sprite position={SUN.toArray()} scale={[2.2 + burst * 3, 2.2 + burst * 3, 1]} renderOrder={2}>
          <spriteMaterial map={core} transparent depthWrite={false} />
        </sprite>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[R_PLANET, 96, 64]} />
          <meshStandardMaterial color={planetColor} roughness={0.85} />
        </mesh>
        <group rotation={[-Math.PI / 2 + 0.32, 0.18, 0]}>
          {bands.map((b, i) => (
            <mesh key={i} geometry={b.geo} castShadow>
              <meshBasicMaterial color={ringColor} transparent opacity={b.a} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const meta = defineObject({
  name: 'SaturnRise',
  route: 'three',
  package: 'three',
  export: 'SaturnRise',
  summary: 'Eclipse-to-sunrise over a ringed planet: ring of fire at frame 0, camera dive, one light burst as the sun clears the edge, ring-stripe shadows on the planet. Optional real bloom.',
  params: [
    { name: 'background', type: 'string (hex)', default: '#05060a', note: 'Scene background. Use a dark color with bloom on.' },
    { name: 'planetColor', type: 'string (hex)', default: '#6b7280' },
    { name: 'ringColor', type: 'string (hex)', default: '#e5e7eb', note: 'Color of the ring bands.' },
    { name: 'sunColor', type: 'string (hex)', default: '#ffffff', note: 'Color of the sun glow sprites.' },
    { name: 'bloom', type: 'boolean', default: false, note: 'Add an UnrealBloom post pass (strength 0.9 + burst x 0.9).' },
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [
    { label: 'Plain, light background', comp: 'SaturnRise', props: { background: '#f4f4f4', planetColor: '#3a4a8c', ringColor: '#1a1a1a', sunColor: '#ffc933', bloom: false } },
    { label: 'Bloom on a dark background', comp: 'SaturnRiseBloom', props: { bloom: true } },
  ],
  status: 'stable',
});
