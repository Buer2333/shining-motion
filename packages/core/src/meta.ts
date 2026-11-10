export type Route = '2d' | 'three' | 'gl' | 'fakeui' | 'blender' | 'rig';

export const ROUTES: readonly Route[] = ['2d', 'three', 'gl', 'fakeui', 'blender', 'rig'];

/** One parameter of an object. `type` is a human-readable type description, e.g. "number" or "[number, number]". */
export type ParamSpec = { name: string; type: string; default?: unknown; note?: string };

export type ObjectMeta = {
  name: string;
  route: Route;
  package: string;
  export: string;
  summary: string;
  params: ParamSpec[];
  /** Names of params whose value is a frame number in the finished video. Each must also appear in params. */
  events: string[];
  presets: Record<string, Record<string, unknown>>;
  /** Episodes that use the object, e.g. "NO.07". */
  usedIn: string[];
  samples: { label: string; comp: string; props?: Record<string, unknown> }[];
  status: 'stable' | 'experimental';
};

/** Validate an object's meta at runtime. Throws on invalid meta, returns the same object otherwise. */
export const defineObject = (meta: ObjectMeta): ObjectMeta => {
  const fail = (msg: string): never => {
    throw new Error(`defineObject(${JSON.stringify(meta?.name)}): ${msg}`);
  };
  if (typeof meta.name !== 'string' || !/^[A-Z][A-Za-z0-9]*$/.test(meta.name)) fail('name must be non-empty PascalCase');
  if (!ROUTES.includes(meta.route)) fail(`route must be one of ${ROUTES.join(', ')}`);
  if (!Array.isArray(meta.params)) fail('params must be an array');
  const names = new Set(meta.params.map((p) => p.name));
  for (const e of meta.events ?? []) if (!names.has(e)) fail(`event "${e}" is not listed in params`);
  for (const k of Object.keys(meta.presets ?? {})) if (k.trim() === '') fail('preset key must be non-empty');
  return meta;
};
