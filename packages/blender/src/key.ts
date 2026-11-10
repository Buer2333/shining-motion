/** JSON with object keys sorted at every level and no whitespace. Same value, same string, whatever the key order. */
export const canonicalJson = (v: unknown): string => {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`;
};

const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const MASK = 0xffffffffffffffffn;

/** FNV-1a 64 over the UTF-8 bytes of canonicalJson(params), as 16 hex digits. run.py computes the same value. */
export const cacheKey = (params: unknown): string => {
  let h = FNV_OFFSET;
  for (const b of new TextEncoder().encode(canonicalJson(params))) h = ((h ^ BigInt(b)) * FNV_PRIME) & MASK;
  return h.toString(16).padStart(16, '0');
};
