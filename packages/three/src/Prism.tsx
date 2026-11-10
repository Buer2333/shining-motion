// 3D glass triangular prism + turn-to-face card.
// Three pitfalls (Remotion + three.js): 1) <ThreeCanvas flat> so hex colors are not converted to linear twice; 2) angles come in as props, computed by the
// caller from useCurrentFrame(); no r3f useFrame or clock in here; 3) render with gl=angle (the same frame rendered twice gives the same md5).
// This file depends on three.js, so it is a separate module: import { GlassPrism } from './Prism'.
import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';

import { defineObject } from '../../core/src/meta';

const R = 1.1; // circumradius of the triangular prism (world units)
const LEN = 2.6; // prism length
const SCALE = 1.15;
const CAM_Z = 6;
const FOV = 40;
// World height at z = 0 for a canvas of `size` px: 2 * z * tan(fov / 2)
const WORLD_H = 2 * CAM_Z * Math.tan(((FOV / 2) * Math.PI) / 180);
/** One side face's width / height / apothem on screen, as a fraction of the canvas edge, when it faces the camera. */
export const PRISM_FACE = { w: (R * Math.sqrt(3) * SCALE) / WORLD_H, h: (LEN * SCALE) / WORLD_H, apothem: (R * 0.5 * SCALE) / WORLD_H };
/** Yaw at which side face k faces the camera (upright prism; CylinderGeometry's vertex 0 points to +z, so a 60 degree turn puts a face toward the camera). */
export const faceYaw = (k: number) => Math.PI / 3 + (k * 2 * Math.PI) / 3;

const prismGeo = () => new THREE.CylinderGeometry(R, R, LEN, 3, 1);

// The 9 true edges (two triangles + three vertical edges). A wireframe would also trace the diagonal of each rectangle's triangulation
// (it reads as an "X" on a glass plate), so only geometric edges are drawn, each as a thin cylinder (WebGL line width is always 1px, too thin at 860px).
const prismEdges = () => {
  const v: THREE.Vector3[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3; // same phase as CylinderGeometry's vertices (vertex 0 toward +z)
    v.push(new THREE.Vector3(R * Math.sin(a), LEN / 2, R * Math.cos(a)), new THREE.Vector3(R * Math.sin(a), -LEN / 2, R * Math.cos(a)));
  }
  const pairs: [number, number][] = [[0, 2], [2, 4], [4, 0], [1, 3], [3, 5], [5, 1], [0, 1], [2, 3], [4, 5]];
  return pairs.map(([i, j]) => {
    const a = v[i];
    const b = v[j];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid, q, len: dir.length() };
  });
};

type GlassPrismProps = {
  /** Center of the prism canvas in px. */
  x: number;
  y: number;
  /** Canvas edge in px (rounded to an integer). */
  size: number;
  /** Rotation about the vertical axis, radians. */
  yaw?: number;
  /** Forward tilt, radians. */
  tilt?: number;
  /** 0 = triangular end faces the camera (white light into the prism), 1 = standing up with one rectangular side facing the camera; in between = standing up. */
  view?: number;
  opacity?: number;
  z?: number;
  /** "wire" = whole-mesh wireframe; "real" = only the true edges. */
  edges?: 'wire' | 'real';
  /** 0..1: edges go from `ink` to white (a flash). */
  flash?: number;
  /** Edge color (hex string; it is parsed by three, so no CSS variables). */
  ink?: string;
};

/** Glass prism (physical transmission material). view 0 = end-on, 1 = standing; flash lights the edges up. */
export const GlassPrism: React.FC<GlassPrismProps> = ({ x, y, size: sizeIn, yaw = 0.3, tilt = 0.18, view = 0, opacity = 1, z = 10, edges = 'wire', flash = 0, ink = '#222222' }) => {
  const geo = React.useMemo(prismGeo, []);
  const sticks = React.useMemo(prismEdges, []);
  const size = Math.round(sizeIn); // ThreeCanvas width / height must be integers (zoom and exit tweens give fractions, which throw)
  const rot: [number, number, number] = [Math.PI / 2 * (1 - view) + tilt, yaw, 0];
  const edgeColor = new THREE.Color(ink).lerp(new THREE.Color('#FFFFFF'), Math.max(0, Math.min(1, flash)));
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: z, opacity }}>
      <ThreeCanvas flat width={size} height={size} camera={{ position: [0, 0, CAM_Z], fov: FOV }} gl={{ alpha: true }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} />
        <directionalLight position={[-4, -2, 3]} intensity={0.8} />
        <mesh geometry={geo} rotation={rot} scale={SCALE}>
          <meshPhysicalMaterial transmission={1} thickness={1.6} roughness={0.04} ior={1.5} dispersion={5} color="#ffffff" attenuationColor="#dfe4ff" attenuationDistance={4} />
        </mesh>
        {edges === 'wire' ? (
          <mesh geometry={geo} rotation={rot} scale={SCALE * 1.005}>
            <meshBasicMaterial color={ink} wireframe />
          </mesh>
        ) : (
          <group rotation={rot} scale={SCALE}>
            {sticks.map((s, i) => (
              <mesh key={i} position={s.mid} quaternion={s.q}>
                <cylinderGeometry args={[0.022 + 0.012 * flash, 0.022 + 0.012 * flash, s.len + 0.03, 8, 1]} />
                {/* transparent: three's transmission pre-pass only draws opaque objects, so edges stay out of the refraction (the far vertical edge is not magnified into a center seam) */}
                <meshBasicMaterial color={edgeColor} transparent opacity={0.999} />
              </mesh>
            ))}
          </group>
        )}
      </ThreeCanvas>
    </div>
  );
};

/**
 * Stick a card onto side face k of the standing prism. delta = prism's current yaw - faceYaw(k) (radians); CSS rotateY has the same sign and matrix as
 * three's rotation.y, so the card turns away with the face; at |delta| >= 90 degrees it is behind and not drawn.
 * (cx, cy) = prism center in px, size = prism canvas edge (same value as GlassPrism). Approximate perspective: the card is an overlay, not a texture.
 */
export const FaceTurn: React.FC<{ cx: number; cy: number; size: number; delta: number; w: number; children: React.ReactNode; z?: number }> = ({ cx, cy, size, delta, w, children, z = 30 }) => {
  if (Math.abs(delta) >= Math.PI / 2 - 0.02) return null;
  const off = PRISM_FACE.apothem * size * Math.sin(delta);
  return (
    <div style={{ position: 'absolute', left: cx - w / 2, top: 0, height: '100%', width: w, zIndex: z, perspective: size * 1.6, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 0, top: cy, width: w, transform: `translate(${off}px, -50%) rotateY(${delta}rad)`, transformOrigin: '50% 50%', opacity: Math.min(1, Math.cos(delta) * 1.6) }}>
        {children}
      </div>
    </div>
  );
};

type PostFaceProps = {
  /** Card width in px. */
  w: number;
  /** Body font size; everything else scales from it. */
  px: number;
  /** Nickname + date line; an empty string drops the line. */
  head: string;
  body: string;
  /** Optional extra content under the body. */
  children?: React.ReactNode;
  /** 0..1: highlighter sweep across the body. */
  hiBody?: number;
  /** Card fill. */
  card?: string;
  /** Text color; also the card border and the hard shadow. */
  textColor?: string;
  /** Avatar fill. */
  avatarFill?: string;
  /** Avatar ring. */
  avatarRing?: string;
  /** Highlighter color for hiBody. */
  marker?: string;
  /** Font family of head and body. */
  fontFamily?: string;
};

/** Line-art post card (for turning onto a face or docking): solid fill card + strong border; gray round avatar (no real person), head line, body, optional children. All text comes from the caller. */
export const PostFace: React.FC<PostFaceProps> = ({ w, px, head, body, children, hiBody = 0, card = '#ffffff', textColor = '#1a1a1a', avatarFill = '#d1d5db', avatarRing = '#555555', marker = '#fde68a', fontFamily = 'system-ui, sans-serif' }) => (
  <div style={{ width: w, boxSizing: 'border-box', background: card, border: `4px solid ${textColor}`, boxShadow: `10px 10px 0 ${textColor}`, padding: px * 0.6 }}>
    {head ? <div style={{ display: 'flex', alignItems: 'center', gap: px * 0.35, marginBottom: px * 0.4 }}>
      <span style={{ width: px * 1.05, height: px * 1.05, borderRadius: '50%', background: avatarFill, border: `3px solid ${avatarRing}`, flex: 'none' }} />
      <span style={{ fontFamily, fontWeight: 900, fontSize: px * 0.8, color: textColor, whiteSpace: 'nowrap' }}>{head}</span>
    </div> : null}
    <div style={{ fontFamily, fontWeight: 900, fontSize: px, lineHeight: 1.3, color: textColor, wordBreak: 'break-all', whiteSpace: 'pre-line' }}>
      <span style={{ backgroundImage: `linear-gradient(${marker}, ${marker})`, backgroundSize: `${hiBody * 100}% 100%`, backgroundRepeat: 'no-repeat' }}>{body}</span>
    </div>
    {children ? <div style={{ marginTop: px * 0.4 }}>{children}</div> : null}
  </div>
);

export const meta = defineObject({
  name: 'GlassPrism',
  route: 'three',
  package: 'three',
  export: 'GlassPrism',
  summary: 'Glass triangular prism (transmission material) that can stand up, turn face to face, and flash its edges. Also exports FaceTurn (stick a card on a face), PostFace (line-art post card), faceYaw and PRISM_FACE.',
  params: [
    { name: 'x', type: 'number (px)', note: 'Canvas center, horizontal.' },
    { name: 'y', type: 'number (px)', note: 'Canvas center, vertical.' },
    { name: 'size', type: 'number (px)', note: 'Canvas edge, rounded to an integer.' },
    { name: 'yaw', type: 'number (rad)', default: 0.3, note: 'Rotation about the vertical axis. Use faceYaw(k) to face side k to the camera.' },
    { name: 'tilt', type: 'number (rad)', default: 0.18, note: 'Forward tilt.' },
    { name: 'view', type: 'number 0..1', default: 0, note: '0 = triangular end faces the camera; 1 = standing, a rectangular side faces the camera.' },
    { name: 'opacity', type: 'number', default: 1 },
    { name: 'z', type: 'number', default: 10 },
    { name: 'edges', type: '"wire" | "real"', default: 'wire', note: '"real" draws only the 9 true edges as thin cylinders.' },
    { name: 'flash', type: 'number 0..1', default: 0, note: 'Edges go from ink to white; also thickens the edges.' },
    { name: 'ink', type: 'string (hex)', default: '#222222', note: 'Edge color. Parsed by three, so a hex string, not a CSS variable.' },
  ],
  events: [],
  presets: {},
  usedIn: ['NO.07'],
  samples: [
    { label: 'End-on, slow turn', comp: 'GlassPrism' },
    { label: 'Standing, a post card on the facing side', comp: 'GlassPrismFace' },
  ],
  status: 'stable',
});
