// Shared look for the fake-UI parts. Every part takes an optional `theme` (a partial of this) and fills the rest from `defaultTheme`.
// Colors are any CSS color string, including `var(--x)`; fonts are CSS font-family strings.
export type FakeTheme = {
  /** Text and strong lines. */
  ink: string;
  /** Secondary text, avatar rings. */
  inkSoft: string;
  /** Card / panel fill. */
  card: string;
  /** Accent: hard shadows, fills, checkmarks. */
  field: string;
  /** Text on `ink` or `field` fills. */
  fieldInk: string;
  /** Strong divider lines. */
  rule: string;
  /** Faint lines, empty fills. */
  ruleSoft: string;
  /** Highlighter fill. */
  marker: string;
  /** Alert / peak color. */
  wrong: string;
  /** Terminal window background. */
  code: string;
  /** Terminal text. */
  paper: string;
  fontBody: string;
  fontDisplay: string;
  /** Monospace face for terminal and small labels. */
  fontMeta: string;
};

export const defaultTheme: FakeTheme = {
  ink: '#1a1a1a',
  inkSoft: '#555555',
  card: '#ffffff',
  field: '#6b7280',
  fieldInk: '#ffffff',
  rule: '#9ca3af',
  ruleSoft: '#d1d5db',
  marker: '#fde68a',
  wrong: '#dc2626',
  code: '#202124',
  paper: '#f5f5f5',
  fontBody: 'system-ui, sans-serif',
  fontDisplay: 'system-ui, sans-serif',
  fontMeta: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

export const themed = (theme?: Partial<FakeTheme>): FakeTheme => ({ ...defaultTheme, ...theme });

/** Param spec shared by every part's meta. */
export const THEME_PARAM = {
  name: 'theme',
  type: 'Partial<FakeTheme>',
  note: 'Colors and fonts: ink, inkSoft, card, field, fieldInk, rule, ruleSoft, marker, wrong, code, paper, fontBody, fontDisplay, fontMeta. Missing keys use neutral grays and system fonts.',
} as const;
