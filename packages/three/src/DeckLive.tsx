// A deck of textured cards in depth, seen from the side and turning to face the camera (three.js, flat plane array).
// Layer k (0 = farthest) fades to lerp(1, 1/(k+1), front) and is drawn in order, so at gap -> 0 and az = 0 the front view
// is the running average of the layers. Camera and card poses are computed per frame by the parent and passed in.
// Remotion + three notes: <ThreeCanvas flat>; motion comes from useCurrentFrame only (no useFrame); render with gl=angle;
// colors are hex strings; textures are sRGB and the material is unlit, so the original colors come through.
import React, { useEffect, useState } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { cancelRender, continueRender, delayRender } from 'remotion';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { defineObject } from '../../core/src/meta';

export const FOV = 30;
/** World edge length of one card. */
export const PLANE = 2;
/** Layer count the stacking helpers assume. */
export const N = 9;
const CW = 1920;
const CH = 1080;
const D2R = Math.PI / 180;

/**
 * Orbit camera around the deck center (the origin): azimuth az (0 = head on), elevation el, distance dist (degrees, world units).
 * cx / cy (optional) = where the deck center lands on the 1920x1080 canvas, in px. When given, the camera carries a view offset
 * (a lens shift, perspective unchanged) and the canvas stays full screen.
 */
export type DeckCam = { az: number; el: number; dist: number; cx?: number; cy?: number };

export const makeCam = ({ az, el, dist, cx, cy }: DeckCam) => {
  const c = new THREE.PerspectiveCamera(FOV, CW / CH, 0.05, 100);
  const a = az * D2R;
  const e = el * D2R;
  c.position.set(Math.sin(a) * Math.cos(e) * dist, Math.sin(e) * dist, Math.cos(a) * Math.cos(e) * dist);
  c.lookAt(0, 0, 0);
  if (cx !== undefined && cy !== undefined) c.setViewOffset(CW, CH, CW / 2 - cx, CH / 2 - cy, CW, CH);
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return c;
};

/** World point to canvas px (1920x1080, origin top left). */
export const project = (c: THREE.PerspectiveCamera, x: number, y: number, z: number) => {
  const v = new THREE.Vector3(x, y, z).project(c);
  return { x: ((v.x + 1) / 2) * CW, y: ((1 - v.y) / 2) * CH };
};

/** Head on, a card's edge in px = PLANE * CH / (2 * dist * tan(FOV / 2)); this solves for dist. */
export const distFor = (px: number) => (PLANE * CH) / (2 * px * Math.tan((FOV / 2) * D2R));
export const layerZ = (k: number, gap: number) => (k - (N - 1) / 2) * gap;

/** Loads image urls as sRGB textures and holds the render until they are ready. Returns null while loading. */
export const useDeckTextures = (urls: string[]) => {
  const [handle] = useState(() => delayRender('deck textures'));
  const [tex, setTex] = useState<THREE.Texture[] | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(urls.map((u) => loader.loadAsync(u)))
      .then((ts) => {
        ts.forEach((t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = 8;
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
        });
        setTex(ts);
      })
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (tex) continueRender(handle);
  }, [tex, handle]);
  return tex;
};

const Rig: React.FC<{ cam: THREE.PerspectiveCamera }> = ({ cam }) => {
  const { camera } = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.fov = cam.fov;
  c.position.copy(cam.position);
  c.quaternion.copy(cam.quaternion);
  if (cam.view) c.setViewOffset(CW, CH, cam.view.offsetX, cam.view.offsetY, CW, CH);
  else c.clearViewOffset();
  c.updateProjectionMatrix();
  c.updateMatrixWorld(true);
  return null;
};

const B = 0.012; // edge line width in world units (about 4px head on)

// One card = a textured plane plus four edge bars (the bars only show when seen from the side; they fade out before the front view).
const Card: React.FC<{ k: number; tex: THREE.Texture; z: number; opacity: number; edge: number; edgeColor: string; pos?: [number, number, number]; quat?: THREE.Quaternion }> = ({ k, tex, z, opacity, edge, edgeColor, pos, quat }) => {
  const h = PLANE / 2;
  const bars: [number, number, number, number][] = [[0, h, PLANE + B, B], [0, -h, PLANE + B, B], [-h, 0, B, PLANE + B], [h, 0, B, PLANE + B]];
  return (
    <group position={pos ?? [0, 0, z]} quaternion={quat ?? new THREE.Quaternion()}>
      <mesh renderOrder={k * 2}>
        <planeGeometry args={[PLANE, PLANE]} />
        <meshBasicMaterial map={tex} toneMapped={false} transparent opacity={opacity} depthWrite={false} depthTest={false} />
      </mesh>
      {edge > 0.001 &&
        bars.map(([x, y, w, hh], i) => (
          <mesh key={i} position={[x, y, 0]} renderOrder={k * 2 + 1}>
            <planeGeometry args={[w, hh]} />
            <meshBasicMaterial color={edgeColor} toneMapped={false} transparent opacity={edge * 0.55} depthWrite={false} depthTest={false} />
          </mesh>
        ))}
    </group>
  );
};

const Canvas: React.FC<{ cam: THREE.PerspectiveCamera; fullscreen: boolean; cx: number; cy: number; children: React.ReactNode }> = ({ cam, fullscreen, cx, cy, children }) => (
  <div style={{ position: 'absolute', left: fullscreen ? 0 : cx - CW / 2, top: fullscreen ? 0 : cy - CH / 2, width: CW, height: CH }}>
    <ThreeCanvas flat width={CW} height={CH} camera={{ fov: FOV, position: [0, 0, 10], near: 0.05, far: 100 }}>
      <Rig cam={cam} />
      {children}
    </ThreeCanvas>
  </div>
);

/** Static deck: every layer at its z, opacity lerp(1, 1/(k+1), front), edges fade with `edge`. */
export const Deck3D: React.FC<{ tex: THREE.Texture[]; cam: DeckCam; gap: number; front: number; edge: number; cx?: number; cy?: number; fullscreen?: boolean; edgeColor?: string }> = ({ tex, cam, gap, front, edge, cx = CW / 2, cy = CH / 2, fullscreen, edgeColor = '#222222' }) => {
  const c = makeCam(cam);
  return (
    <Canvas cam={c} fullscreen={fullscreen ?? cam.cx !== undefined} cx={cx} cy={cy}>
      {tex.map((t, k) => (
        <Card key={k} k={k} tex={t} z={layerZ(k, gap)} opacity={1 + (1 / (k + 1) - 1) * front} edge={edge} edgeColor={edgeColor} />
      ))}
    </Canvas>
  );
};

/** One card with its own pose: k = layer index (draw order and texture), opacity, edge = edge-bar strength 0..1, pos / quat = world pose. */
export type LiveCard = { k: number; opacity: number; edge: number; pos: [number, number, number]; quat: THREE.Quaternion };

/**
 * Deck where every card carries its own position and orientation, so cards can fly in from a screen position while the camera turns.
 * Two placements: by default the canvas is shifted so the deck center lands at (cx, cy); with `fullscreen` (or cam.cx / cam.cy set) the
 * canvas stays full screen and the camera view offset does the shifting, so flights are never clipped by the canvas edge.
 */
export const DeckLive: React.FC<{ tex: THREE.Texture[]; cam: DeckCam; cards: LiveCard[]; cx?: number; cy?: number; fullscreen?: boolean; edgeColor?: string }> = ({ tex, cam, cards, cx = CW / 2, cy = CH / 2, fullscreen, edgeColor = '#222222' }) => {
  const c = makeCam(cam);
  return (
    <Canvas cam={c} fullscreen={fullscreen ?? cam.cx !== undefined} cx={cx} cy={cy}>
      {cards.map((d) => (
        <Card key={d.k} k={d.k} tex={tex[d.k]} z={0} opacity={d.opacity} edge={d.edge} edgeColor={edgeColor} pos={d.pos} quat={d.quat} />
      ))}
    </Canvas>
  );
};

/** Canvas px to the world point on that pixel's sight line, `depth` in front of the camera plane. Use it to start a flight from a screen position. */
export const unprojectAt = (c: THREE.PerspectiveCamera, px: number, py: number, depth: number): [number, number, number] => {
  const v = new THREE.Vector3((px / CW) * 2 - 1, 1 - (py / CH) * 2, 0.5).unproject(c);
  const dir = v.sub(c.position).normalize();
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion);
  const p = c.position.clone().add(dir.multiplyScalar(depth / dir.dot(fwd)));
  return [p.x, p.y, p.z];
};

export const meta = defineObject({
  name: 'DeckLive',
  route: 'three',
  package: 'three',
  export: 'DeckLive',
  summary: 'Nine textured cards stacked in depth, seen from the side and turning to face the camera; each card has its own pose so cards can fly in. Canvas can follow the deck or stay full screen with a camera view offset.',
  params: [
    { name: 'tex', type: 'THREE.Texture[]', note: 'One texture per layer, index = layer (0 = farthest). Load with useDeckTextures(urls).' },
    { name: 'cam', type: '{ az, el, dist, cx?, cy? }', note: 'Orbit camera: azimuth and elevation in degrees, distance in world units. cx / cy = where the deck center lands on the 1920x1080 canvas (camera view offset); setting them keeps the canvas full screen.' },
    { name: 'cards', type: 'LiveCard[]', note: 'Per card: k, opacity, edge (0..1), pos [x, y, z], quat. Parent computes these from the current frame.' },
    { name: 'cx', type: 'number (px)', default: 960, note: 'Follow-canvas mode only: canvas is shifted so the deck center lands here.' },
    { name: 'cy', type: 'number (px)', default: 540, note: 'Follow-canvas mode only: same, vertical.' },
    { name: 'fullscreen', type: 'boolean', default: 'true when cam.cx is set', note: 'Keep the canvas at 0,0 and shift with the camera view offset instead of moving the canvas.' },
    { name: 'edgeColor', type: 'string (hex)', default: '#222222', note: 'Color of the card edge bars.' },
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [
    { label: 'Side view, canvas follows the deck', comp: 'DeckLive' },
    { label: 'Full screen with camera view offset', comp: 'DeckLiveFullscreen' },
  ],
  status: 'stable',
});
