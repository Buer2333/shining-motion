// GLPasses render check (not part of vitest: it needs a browser). Run: npm run test:gl [-- --out <dir>]
// Renders three stills through @remotion/renderer with chromium gl=angle and asserts the center pixel of each:
//   (a) one pass writing (255, 0, 0)                          -> (255, 0, 0) +-1
//   (b) pass 1 writes (64, 128, 192); pass 2 samples it, 1-c  -> (191, 127, 63) +-1   (proves the texture binding)
//   (c) the same two passes in reverse order                  -> not (191, 127, 63)    (proves the order matters)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { PNG } from 'pngjs';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const outDir = outIdx >= 0 ? resolve(argv[outIdx + 1]) : mkdtempSync(join(tmpdir(), 'glpasses-'));
mkdirSync(outDir, { recursive: true });
const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const serveUrl = await bundle({ entryPoint: join(root, 'gallery/remotion/index.ts') });

const center = async (id) => {
  const chromiumOptions = { gl: 'angle' };
  const composition = await selectComposition({ serveUrl, id, chromiumOptions });
  const output = join(outDir, `${id}.png`);
  await renderStill({ composition, serveUrl, output, frame: 0, chromiumOptions, timeoutInMilliseconds: 120000 });
  const png = PNG.sync.read(readFileSync(output));
  const i = ((png.height >> 1) * png.width + (png.width >> 1)) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
};
const near = (a, b, tol = 1) => a.every((v, k) => Math.abs(v - b[k]) <= tol);

const a = await center('GLSolid');
const b = await center('GLTwoPass');
const c = await center('GLReversed');
const checks = [
  ['(a) single pass solid red      ', a, near(a, [255, 0, 0]), 'expect (255,0,0)+-1'],
  ['(b) two pass, pass 2 = 1 - c   ', b, near(b, [191, 127, 63]), 'expect (191,127,63)+-1'],
  ['(c) passes reversed            ', c, !near(c, [191, 127, 63]), 'expect != (191,127,63)'],
];
let ok = true;
for (const [label, px, pass, want] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label} got (${px.join(',')})  ${want}`);
  ok &&= pass;
}
console.log(`stills in ${outDir}`);
process.exit(ok ? 0 : 1);
