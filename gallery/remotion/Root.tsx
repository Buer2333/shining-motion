import React from 'react';
import { Composition } from 'remotion';
import { DeckLiveSample, DeckLiveFullscreenSample } from './DeckLiveSample';

const C = (id: string, component: React.FC, w = 1920, h = 1080) => (
  <Composition id={id} component={component} width={w} height={h} fps={30} durationInFrames={30} />
);

export const Root: React.FC = () => (
  <>
    {C('DeckLive', DeckLiveSample)}
    {C('DeckLiveFullscreen', DeckLiveFullscreenSample)}
  </>
);
