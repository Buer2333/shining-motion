import React from 'react';
import { AbsoluteFill } from 'remotion';
import { FaceTurn, GlassPrism, PostFace, faceYaw } from '../../packages/three/src/Prism';
import { DEFAULT_SPECTRUM, LightBeam, LightCone, SpectrumBand } from '../../packages/2d/src/Light';

const BG = '#2f3a52';

/** End-on prism with a white beam coming in and the seven-color band going out (portrait 1080x1920 layout values). */
export const GlassPrismSample: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <LightBeam from={[0, 640]} to={[330, 770]} />
    <GlassPrism x={440} y={790} size={540} yaw={0.32} tilt={0.2} view={0} edges="real" flash={0} ink="#141414" />
  </AbsoluteFill>
);

/** Standing prism, face 0 toward the camera, a post card stuck on it. */
export const GlassPrismFaceSample: React.FC = () => {
  const size = 860;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <GlassPrism x={540} y={760} size={size} yaw={faceYaw(0)} tilt={0.3} view={1} edges="real" ink="#141414" />
      <FaceTurn cx={540} cy={760} size={size} delta={0} w={460}>
        <PostFace w={460} px={40} head="someone 09-14" body="#a short post" />
      </FaceTurn>
    </AbsoluteFill>
  );
};

/** Cone of light, a beam, and the spectrum band fanned out. */
export const LightBeamSample: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <LightCone apex={[150, 236]} to={[700, 1420]} halfW={250} opacity={0.14} z={3} />
    <LightBeam from={[0, 640]} to={[330, 770]} />
    <SpectrumBand origin={[520, 830]} dir={1.2} len={760} bw={70} spread={0.42} spectrum={DEFAULT_SPECTRUM} />
  </AbsoluteFill>
);
