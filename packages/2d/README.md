# @shining-motion/2d

Flat 2D objects for [Remotion](https://www.remotion.dev). Every object is a pure function of the frame, so a render comes out the same each time. Each object file also exports `meta` (typed params, frame-number events, presets), which `npm run meta` collects at the repo root.

| Object | What it does |
|---|---|
| `Dust` | A seeded field of faint specks, still or drifting |
| `GrayLines` | Placeholder text lines, with an optional line-by-line reveal |
| `Seal` | A stamp that lands, settles and leaves ink specks |

Shared helpers (`rectToQuad`, easing, `lerp`) live in [`@shining-motion/core`](../core). Files in this package import core by relative path, not by package name.

MIT. Remotion has its own license: see [remotion.dev/license](https://www.remotion.dev/license).
