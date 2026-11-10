# @shining-motion/blender

Interface only, no objects yet. A Blender-rendered sequence is addressed by what produced it:

- `params.json` (what the generator reads) -> `cacheKey(params)` = FNV-1a 64 of the canonical JSON (keys sorted, no spaces), 16 hex digits
- frames live at `<cache root>/<object>/<key>/%04d.png`
- `BlenderSequence` (Remotion) plays `public/<base>/<object>/<key>/<frame>.png`
- `run.py --params params.json --object <name> --out <cache root>` prints that directory; it never starts Blender

`src/key.ts` and `run.py` are the same algorithm in two languages, pinned by `tests/vectors.json`.

MIT.
