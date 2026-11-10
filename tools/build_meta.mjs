// Collect every object's meta into meta.json. Run with: npm run meta (tsx).
// Convention: an object file exports `meta = defineObject({...})`; the package's src/index.ts re-exports it as
// `<Name>Meta` (`export { Dust, meta as DustMeta } from './Dust'`). Any export named *Meta is collected.
import { readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { defineObject } from '../packages/core/src/meta.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['rig']);
const objects = [];
const seen = new Map();

for (const pkg of readdirSync(join(root, 'packages')).sort()) {
  if (SKIP.has(pkg)) continue;
  const entry = join(root, 'packages', pkg, 'src', 'index.ts');
  if (!existsSync(entry)) continue;
  const mod = await import(pathToFileURL(entry).href);
  for (const [key, value] of Object.entries(mod)) {
    if (!key.endsWith('Meta')) continue;
    const meta = defineObject(value); // throws on invalid meta
    if (meta.package !== pkg) throw new Error(`${key}: meta.package "${meta.package}" does not match directory "${pkg}"`);
    if (seen.has(meta.name)) {
      console.error(`duplicate object name "${meta.name}" in ${seen.get(meta.name)} and ${pkg}`);
      process.exit(1);
    }
    seen.set(meta.name, pkg);
    objects.push(meta);
  }
}

objects.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
writeFileSync(join(root, 'meta.json'), JSON.stringify({ schema: 1, objects }, null, 2) + '\n');
console.log(`meta.json: ${objects.length} objects (${objects.map((o) => o.name).join(', ')})`);
