// Line-art social post card: platform tag + gray round avatar (no real person) + nickname + date, one line of text, a media slot (children),
// heart + like count at the bottom. All text comes from the caller; the component writes none. Frame: white card, strong line, hard shadow.
import React from 'react';

import { defineObject } from '../../core/src/meta';
import { themed, THEME_PARAM, type FakeTheme } from './theme';

type SocialPostProps = {
  x: number;
  y: number;
  w: number;
  /** Platform tag text. */
  platform: string;
  /** Omit for the compact card (platform tag + text + likes only). */
  nick?: string;
  date?: string;
  text: string;
  likes: string;
  /** Body font size; everything else scales from it. */
  px?: number;
  /** Height of the media slot; children are drawn inside it, origin top left. */
  mediaH?: number;
  children?: React.ReactNode;
  /** Like-count font size = px x likesK. */
  likesK?: number;
  opacity?: number;
  z?: number;
  theme?: Partial<FakeTheme>;
};

export const SocialPost: React.FC<SocialPostProps> = ({ x, y, w, platform, nick, date, text, likes, px = 40, mediaH = 0, children, likesK = 0.95, opacity = 1, z, theme }) => {
  const t = themed(theme);
  const pad = px * 0.55;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, boxSizing: 'border-box', background: t.card, border: `4px solid ${t.ink}`, boxShadow: `12px 12px 0 ${t.field}`, padding: pad, opacity, zIndex: z }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: px * 0.35 }}>
        <span style={{ padding: `${px * 0.06}px ${px * 0.22}px`, background: t.ink, color: t.fieldInk, fontFamily: t.fontBody, fontWeight: 900, fontSize: px * 0.6, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{platform}</span>
        {nick !== undefined ? (
          <>
            <span style={{ width: px * 0.95, height: px * 0.95, borderRadius: '50%', background: t.ruleSoft, border: `3px solid ${t.inkSoft}`, flex: 'none' }} />
            <span style={{ fontFamily: t.fontBody, fontWeight: 900, fontSize: px * 0.75, color: t.ink, whiteSpace: 'nowrap' }}>{nick}</span>
            <span style={{ fontFamily: t.fontMeta, fontWeight: 700, fontSize: px * 0.55, color: t.inkSoft, whiteSpace: 'nowrap' }}>{date}</span>
          </>
        ) : null}
      </div>
      <div style={{ marginTop: px * 0.35, fontFamily: t.fontBody, fontWeight: 700, fontSize: px, lineHeight: 1.25, color: t.ink, whiteSpace: 'nowrap' }}>{text}</div>
      {mediaH ? <div style={{ position: 'relative', marginTop: px * 0.35, height: mediaH, fontFamily: t.fontBody }}>{children}</div> : null}
      <div style={{ marginTop: px * 0.3, display: 'flex', alignItems: 'center', gap: px * 0.25 }}>
        <svg width={px * 0.9 * likesK} height={px * 0.8 * likesK} viewBox="0 0 36 32">
          <path d="M18 30 C 6 21 2 15 2 9.5 C 2 5 5.5 2 9.5 2 C 13 2 16 4 18 7 C 20 4 23 2 26.5 2 C 30.5 2 34 5 34 9.5 C 34 15 30 21 18 30 Z" fill="none" stroke={t.ink} strokeWidth={3.5} strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: t.fontDisplay, fontSize: px * likesK, color: t.ink, whiteSpace: 'nowrap' }}>{likes}</span>
      </div>
    </div>
  );
};

export const meta = defineObject({
  name: 'SocialPost',
  route: 'fakeui',
  package: 'fakeui',
  export: 'SocialPost',
  summary: 'Line-art social post card with platform tag, gray avatar, one line of text, media slot and like count. Compact variant when nick is omitted.',
  params: [
    { name: 'x', type: 'number (px)' },
    { name: 'y', type: 'number (px)' },
    { name: 'w', type: 'number (px)' },
    { name: 'platform', type: 'string', note: 'Platform tag text.' },
    { name: 'nick', type: 'string', note: 'Omit for the compact card.' },
    { name: 'date', type: 'string' },
    { name: 'text', type: 'string', note: 'One line of post text.' },
    { name: 'likes', type: 'string', note: 'Like count as shown.' },
    { name: 'px', type: 'number (px)', default: 40, note: 'Body font size; everything else scales from it.' },
    { name: 'mediaH', type: 'number (px)', default: 0, note: 'Media slot height; children are drawn inside it.' },
    { name: 'children', type: 'ReactNode', note: 'Media content.' },
    { name: 'likesK', type: 'number', default: 0.95, note: 'Like-count font size = px x likesK.' },
    { name: 'opacity', type: 'number', default: 1 },
    { name: 'z', type: 'number' },
    THEME_PARAM,
  ],
  events: [],
  presets: {},
  usedIn: [],
  samples: [{ label: 'Full post card with a media slot', comp: 'SocialPost' }],
  status: 'stable',
});
