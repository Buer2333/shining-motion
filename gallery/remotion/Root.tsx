import React from 'react';
import { Composition } from 'remotion';
import { DeckLiveSample, DeckLiveFullscreenSample } from './DeckLiveSample';
import { GLPassesSample, GLReversed, GLSolid, GLTwoPass } from './GLPassesSample';
import { SaturnRiseSample, SaturnRiseBloomSample } from './SaturnRiseSample';

const C = (id: string, component: React.FC, w = 1920, h = 1080, frames = 30) => (
  <Composition id={id} component={component} width={w} height={h} fps={30} durationInFrames={frames} />
);

export const Root: React.FC = () => (
  <>
    {C('DeckLive', DeckLiveSample)}
    {C('DeckLiveFullscreen', DeckLiveFullscreenSample)}
    {C('SaturnRise', SaturnRiseSample, 1920, 1080, 180)}
    {C('SaturnRiseBloom', SaturnRiseBloomSample, 1920, 1080, 180)}
    {C('GLPasses', GLPassesSample)}
    {C('GLSolid', GLSolid, 64, 64)}
    {C('GLTwoPass', GLTwoPass, 64, 64)}
    {C('GLReversed', GLReversed, 64, 64)}
  </>
);
