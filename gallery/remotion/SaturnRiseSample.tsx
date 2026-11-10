import React from 'react';
import { SaturnRise } from '../../packages/three/src/SaturnRise';

/** Plain version on a light background; render frame 84 for the light burst. */
export const SaturnRiseSample: React.FC = () => (
  <SaturnRise background="#f4f4f4" planetColor="#3a4a8c" ringColor="#1a1a1a" sunColor="#ffc933" bloom={false} />
);

/** Same scene on a dark background with the bloom pass. */
export const SaturnRiseBloomSample: React.FC = () => <SaturnRise bloom />;
