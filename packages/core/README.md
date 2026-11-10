# @shining-motion/core

What every route shares: `ObjectMeta` / `defineObject` (the meta contract), deterministic `hash` / `rng`, easing and `lerp`, `progress` / `frameEvent` for frame-number events, and the geometry helpers `rectToQuad` (CSS `matrix3d` onto a quad) and `decay`.

Note on names: `geom.ts` keeps the frame-based `easeOut(frame, start, duration)` / `easeInOut` / `clamp` (Remotion options) from the old kit. The plain curves on t in [0, 1] live in `ease.ts` and are exported from the index as `easeIn`, `easeOutT`, `easeInOutT`, `clampTo`.

MIT.
