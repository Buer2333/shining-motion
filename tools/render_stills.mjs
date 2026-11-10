// Render one still per composition from gallery/remotion with @remotion/renderer (not the CLI).
// Usage: node tools/render_stills.mjs <outDir> <CompId> [<CompId> ...]   (frame 0; CompId=Name@12 renders frame 12)
// WebGL / three.js compositions are rendered with chromium gl=angle.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [outArg, ...ids] = process.argv.slice(2);
if (!outArg || ids.length === 0) {
  console.error('usage: node tools/render_stills.mjs <outDir> <CompId[@frame]> ...');
  process.exit(2);
}
const outDir = resolve(outArg);
mkdirSync(outDir, { recursive: true });
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const serveUrl = await bundle({ entryPoint: join(root, 'gallery/remotion/index.ts') });
for (const spec of ids) {
  const [id, fr] = spec.split('@');
  const chromiumOptions = { gl: 'angle' };
  const composition = await selectComposition({ serveUrl, id, chromiumOptions });
  const output = join(outDir, `${id}.png`);
  await renderStill({ composition, serveUrl, output, frame: fr ? Number(fr) : 0, chromiumOptions, timeoutInMilliseconds: 120000 });
  console.log(`${id} -> ${output}`);
}
