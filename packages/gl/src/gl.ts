// Generic multi-pass WebGL2 runner: compile fragment shaders, draw a full-screen triangle per pass in order, feed an earlier pass's
// output texture to a later pass as a sampler uniform, and draw the last pass to the canvas. No scene or shader content lives here.
// Frame-deterministic: output depends only on the uniforms you pass to draw(). Render with chromium gl=angle.

/**
 * Uniform values by name. A number is a float (an int when the name starts with "i"); arrays go by length (2, 3, 4 = vec2/3/4, longer = float array)
 * and by name prefix: "v3" = vec3, "v4" = vec4, "f1" = float array.
 */
export type Uni = Record<string, number | number[] | Float32Array>;

export type PassSpec = {
  /** Name other passes use to read this pass's output. Default `p<index>`. */
  id?: string;
  /** Fragment shader (GLSL ES 3.00). Without a leading `#version`, `#version 300 es` and `precision highp float;` are prepended. Declare your own `out vec4`. */
  fs: string;
  /**
   * Sampler uniform name -> source. A source is the id of an EARLIER pass (its output texture), or any other name = an external texture
   * filled with `setTexture(name, image)`. A source that names a LATER pass (or an external texture not set yet) reads as transparent black.
   */
  inputs?: Record<string, string>;
  /** Render-target size relative to the canvas (e.g. 2 = supersample). Default 1. Ignored for the last pass, which draws at canvas size. */
  scale?: number;
  /** RGBA32F target (needs EXT_color_buffer_float) instead of RGBA8. Default false. Ignored for the last pass. */
  float?: boolean;
};

export type Rig = {
  /** Draw every pass in order with these uniforms. Each pass also gets `uRes` = its own target size in px. Ends with gl.finish(). */
  draw: (u: Uni) => void;
  /** Upload an image / canvas to the external texture `name` (mipmapped, linear). `premultiply` premultiplies alpha on upload. */
  setTexture: (name: string, src: TexImageSource, opts?: { premultiply?: boolean }) => void;
  /** Release the GL context. */
  lose: () => void;
};

const VS = `#version 300 es
in vec2 a; void main(){ gl_Position=vec4(a,0.,1.); }`;

const compile = (gl: WebGL2RenderingContext, vs: string, fs: string) => {
  const mk = (t: number, s: string) => {
    const sh = gl.createShader(t)!;
    gl.shaderSource(sh, s);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error('GLSL: ' + gl.getShaderInfoLog(sh));
    return sh;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'a');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('LINK: ' + gl.getProgramInfoLog(p));
  return p;
};

const setU = (gl: WebGL2RenderingContext, p: WebGLProgram, u: Uni) => {
  for (const k of Object.keys(u)) {
    const v = u[k];
    const isArr = typeof v !== 'number';
    const loc = gl.getUniformLocation(p, isArr && (v as number[]).length > 4 ? k + '[0]' : k) ?? gl.getUniformLocation(p, k);
    if (!loc) continue;
    if (typeof v === 'number') {
      if (k.startsWith('i')) gl.uniform1i(loc, v);
      else gl.uniform1f(loc, v);
    } else {
      const a = v as number[];
      if (k.startsWith('v3')) gl.uniform3fv(loc, a);
      else if (k.startsWith('v4')) gl.uniform4fv(loc, a);
      else if (k.startsWith('f1')) gl.uniform1fv(loc, a);
      else if (a.length === 2) gl.uniform2fv(loc, a);
      else if (a.length === 3) gl.uniform3fv(loc, a);
      else if (a.length === 4) gl.uniform4fv(loc, a);
      else gl.uniform1fv(loc, a);
    }
  }
};

/** Build a pass runner on `cv` (its width / height set the final resolution). Throws if WebGL2 (or float targets, when asked for) is unavailable. */
export const makeRig = (cv: HTMLCanvasElement, passes: PassSpec[]): Rig => {
  if (passes.length === 0) throw new Error('makeRig: at least one pass');
  const W = cv.width;
  const H = cv.height;
  const gl = cv.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl2');
  if (passes.some((p, i) => p.float && i < passes.length - 1) && !gl.getExtension('EXT_color_buffer_float')) throw new Error('no float rt');

  const ids = passes.map((p, i) => p.id ?? `p${i}`);
  if (new Set(ids).size !== ids.length) throw new Error('makeRig: duplicate pass id');
  const progs = passes.map((p) => compile(gl, VS, /^\s*#version/.test(p.fs) ? p.fs : `#version 300 es\nprecision highp float;\n${p.fs}`));

  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const blank = () => {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const empty = blank();

  // one render target per non-final pass
  const size = passes.map((p, i) => (i === passes.length - 1 ? [W, H] : [Math.round(W * (p.scale ?? 1)), Math.round(H * (p.scale ?? 1))]));
  const targets = passes.map((p, i) => {
    if (i === passes.length - 1) return null;
    const [w, h] = size[i];
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (p.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const filt = p.float ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, fb };
  });

  // external textures: every input name that is not a pass id
  const ext = new Map<string, WebGLTexture>();
  for (const p of passes) for (const src of Object.values(p.inputs ?? {})) if (!ids.includes(src) && !ext.has(src)) ext.set(src, blank());

  const resolve = (pass: number, src: string): WebGLTexture => {
    const at = ids.indexOf(src);
    if (at === -1) return ext.get(src)!;
    return at < pass ? targets[at]!.t : empty; // later pass = not rendered yet = blank
  };

  return {
    setTexture: (name, src, opts) => {
      const t = ext.get(name);
      if (!t) throw new Error(`setTexture: no pass reads a texture named "${name}"`);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!opts?.premultiply);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    },
    draw: (u) => {
      passes.forEach((p, i) => {
        const [w, h] = size[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, targets[i]?.fb ?? null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(progs[i]);
        setU(gl, progs[i], { ...u, uRes: [w, h] });
        Object.entries(p.inputs ?? {}).forEach(([name, src], unit) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, resolve(i, src));
          const l = gl.getUniformLocation(progs[i], name);
          if (l) gl.uniform1i(l, unit);
        });
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.finish();
    },
    lose: () => gl.getExtension('WEBGL_lose_context')?.loseContext(),
  };
};
