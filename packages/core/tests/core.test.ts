import { describe, expect, it } from 'vitest';
import { defineObject, type ObjectMeta } from '../src/meta';
import { hash, rng } from '../src/random';
import { progress, frameEvent } from '../src/frame';
import { clamp, easeIn, easeInOut, easeOut, lerp } from '../src/ease';
import { rectToQuad } from '../src/index';

const good = (): ObjectMeta => ({
  name: 'Dust', route: '2d', package: '2d', export: 'Dust', summary: 'x',
  params: [{ name: 'n', type: 'number' }, { name: 'at', type: 'number (frame)' }],
  events: ['at'], presets: { calm: { n: 10 } }, usedIn: [], samples: [], status: 'stable',
});

describe('defineObject', () => {
  it('returns the same object when valid', () => {
    const m = good();
    expect(defineObject(m)).toBe(m);
  });
  it('rejects a bad name', () => {
    expect(() => defineObject({ ...good(), name: 'dust' })).toThrow();
    expect(() => defineObject({ ...good(), name: '' })).toThrow();
  });
  it('rejects a bad route', () => {
    expect(() => defineObject({ ...good(), route: 'webgl' as never })).toThrow();
  });
  it('rejects an event that is not in params', () => {
    expect(() => defineObject({ ...good(), events: ['missing'] })).toThrow(/missing/);
  });
  it('rejects an empty preset key', () => {
    expect(() => defineObject({ ...good(), presets: { '': {} } })).toThrow();
  });
});

describe('random', () => {
  it('same seed gives the same output', () => {
    expect(hash(7, 3)).toBe(hash(7, 3));
    const a = rng(5), b = rng(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('different seed gives different output', () => {
    expect(hash(7, 3)).not.toBe(hash(8, 3));
    expect(rng(1)()).not.toBe(rng(2)());
  });
  it('stays in [0, 1)', () => {
    for (let i = 0; i < 500; i++) { const v = hash(191, i); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('frame', () => {
  it('progress clamps at the ends', () => {
    expect(progress(-5, 10, 20)).toBe(0);
    expect(progress(10, 10, 20)).toBe(0);
    expect(progress(20, 10, 20)).toBe(0.5);
    expect(progress(30, 10, 20)).toBe(1);
    expect(progress(99, 10, 20)).toBe(1);
    expect(progress(5, 5, 0)).toBe(0);
  });
  it('frameEvent fires at the event frame', () => {
    expect(frameEvent(9, 10)).toBe(false);
    expect(frameEvent(10, 10)).toBe(true);
  });
});

describe('ease and geom', () => {
  it('curves hit their endpoints', () => {
    for (const f of [easeIn, easeOut, easeInOut]) { expect(f(0)).toBe(0); expect(f(1)).toBe(1); }
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(clamp(5, 0, 1)).toBe(1);
  });
  it('rectToQuad keeps its export', () => {
    expect(rectToQuad(10, 10, [[0, 0], [10, 0], [10, 10], [0, 10]])).toMatch(/^matrix3d\(/);
  });
});
