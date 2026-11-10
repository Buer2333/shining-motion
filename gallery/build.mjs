// meta.json -> gallery/dist/index.html (static, inline CSS). Run with: npm run gallery
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { schema, objects } = JSON.parse(readFileSync(join(root, 'meta.json'), 'utf8'));
if (schema !== 1) throw new Error(`unsupported meta.json schema ${schema}`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const show = (v) => (v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v));
const ROUTES = ['2d', 'three', 'gl', 'fakeui', 'blender', 'rig'];

const list = (items) => (items.length ? items.map((i) => `<code>${esc(i)}</code>`).join(' ') : '<span class="none">none</span>');

const card = (o) => `
<article id="${esc(o.name)}">
  <h3>${esc(o.name)} <span class="tag">${esc(o.status)}</span></h3>
  <p class="sum">${esc(o.summary)}</p>
  <p class="meta"><b>package</b> <code>@shining-motion/${esc(o.package)}</code> <b>export</b> <code>${esc(o.export)}</code></p>
  <table>
    <thead><tr><th>param</th><th>type</th><th>default</th><th>note</th></tr></thead>
    <tbody>${o.params.map((p) => `<tr><td><code>${esc(p.name)}</code>${o.events.includes(p.name) ? ' <span class="tag ev">frame</span>' : ''}</td><td>${esc(p.type)}</td><td>${esc(show(p.default))}</td><td>${esc(p.note ?? '')}</td></tr>`).join('')}</tbody>
  </table>
  <p class="meta"><b>events</b> ${list(o.events)}</p>
  <p class="meta"><b>presets</b> ${list(Object.keys(o.presets))}</p>
  <p class="meta"><b>used in</b> ${list(o.usedIn)}</p>
  <p class="meta"><b>samples</b> ${list(o.samples.map((s) => s.label))}</p>
</article>`;

const routes = ROUTES.filter((r) => objects.some((o) => o.route === r));
const sections = routes
  .map((r) => `<section><h2>${esc(r)} <span class="count">${objects.filter((o) => o.route === r).length}</span></h2>${objects.filter((o) => o.route === r).map(card).join('')}</section>`)
  .join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>shining-motion gallery</title>
<style>
:root { color-scheme: light dark; --bg:#fff; --fg:#1b1d22; --mute:#667; --line:#dcdfe6; --card:#f6f7f9; --acc:#2b59d9; }
@media (prefers-color-scheme: dark) { :root { --bg:#12141a; --fg:#e7e9ee; --mute:#9aa1b2; --line:#2c303b; --card:#1b1e27; --acc:#8aa4ff; } }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.55 system-ui, sans-serif; }
main { max-width:960px; margin:0 auto; padding:24px 16px 64px; }
h1 { font-size:26px; margin:0 0 4px; } h2 { font-size:20px; margin:36px 0 12px; border-bottom:1px solid var(--line); padding-bottom:6px; }
h3 { font-size:17px; margin:0 0 4px; } .count { color:var(--mute); font-weight:400; font-size:14px; }
article { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:14px 16px; margin:14px 0; }
.sum { margin:4px 0 8px; } .meta { margin:6px 0; color:var(--mute); } .meta b { color:var(--fg); font-weight:600; margin-right:4px; }
code { font:13px ui-monospace, Menlo, monospace; color:var(--acc); }
.tag { font-size:11px; font-weight:500; border:1px solid var(--line); border-radius:10px; padding:0 7px; color:var(--mute); vertical-align:middle; } .ev { color:var(--acc); border-color:var(--acc); }
.none { color:var(--mute); }
table { width:100%; border-collapse:collapse; margin:8px 0; font-size:13.5px; display:block; overflow-x:auto; }
th, td { text-align:left; padding:5px 10px 5px 0; border-bottom:1px solid var(--line); vertical-align:top; } th { color:var(--mute); font-weight:500; }
</style>
</head>
<body>
<main>
<h1>shining-motion gallery</h1>
<p class="meta">${objects.length} objects from meta.json (schema ${schema})</p>
${sections}
</main>
</body>
</html>
`;

mkdirSync(join(root, 'gallery', 'dist'), { recursive: true });
writeFileSync(join(root, 'gallery', 'dist', 'index.html'), html);
console.log(`gallery/dist/index.html: ${objects.length} objects`);
