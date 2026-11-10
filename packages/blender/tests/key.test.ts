import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cacheKey, canonicalJson } from '../src/key';

type Vector = { name: string; params: unknown; canonical: string; key: string };
const here = new URL('.', import.meta.url).pathname;
const vectors: Vector[] = JSON.parse(readFileSync(join(here, 'vectors.json'), 'utf8'));
const runPy = join(here, '..', 'run.py');

describe('blender cache key', () => {
  it('has at least 5 vectors', () => expect(vectors.length).toBeGreaterThanOrEqual(5));
  for (const v of vectors) {
    it(`TS matches the vector: ${v.name}`, () => {
      expect(canonicalJson(v.params)).toBe(v.canonical);
      expect(cacheKey(v.params)).toBe(v.key);
    });
    it(`python run.py agrees: ${v.name}`, () => {
      const dir = mkdtempSync(join(tmpdir(), 'blender-key-'));
      const f = join(dir, 'params.json');
      writeFileSync(f, JSON.stringify(v.params));
      const out = execFileSync('python3', [runPy, '--params', f, '--object', 'obj', '--out', '/cache'], { encoding: 'utf8' }).trim();
      expect(out).toBe(`/cache/obj/${v.key}/`);
    });
  }
  it('key order does not matter', () => {
    const a = vectors.find((v) => v.name === 'key-order-a')!;
    const b = vectors.find((v) => v.name === 'key-order-b')!;
    expect(a.key).toBe(b.key);
    expect(cacheKey(a.params)).toBe(cacheKey(b.params));
  });
  it('different params give different keys', () => {
    expect(new Set(vectors.filter((v) => !v.name.startsWith('key-order-b')).map((v) => v.key)).size).toBe(vectors.length - 1);
  });
});
