# shining-motion

用代码做动效短视频的组件库、方法和示例。博客在 [shiningforu.com](https://shiningforu.com)（源码 [Buer2333/shining-light](https://github.com/Buer2333/shining-light)）。

## 方法

[`skills/motion`](skills/motion/SKILL.md)：用代码做动效短视频的方法，可以当 Agent skill 用，也可以直接读。

## 包与路线

npm workspaces，包名 `@shining-motion/<pkg>`，不上 npm。一条路线一个包：

| 包 | 路线 | 放什么 |
|---|---|---|
| [`core`](packages/core) | 共享 | `ObjectMeta` / `defineObject`、确定性 `hash` / `rng`、缓动、`progress` / `frameEvent`、几何（`rectToQuad`） |
| [`2d`](packages/2d) | `2d` | 平面 2D 对象：Dust、GrayLines、Seal、LightBeam（含 LightCone / SpectrumBand） |
| [`three`](packages/three) | `three` | three.js / @remotion/three 对象：DeckLive、SaturnRise、GlassPrism（含 FaceTurn / PostFace） |
| [`gl`](packages/gl) | `gl` | 原生 WebGL2 多 pass 运行器：GLPasses（`npm run test:gl` 渲 still 断言像素） |
| [`fakeui`](packages/fakeui) | `fakeui` | 中性样式的假界面 / 平台 UI 部件：Terminal、UrgencyGauge、CutReel、SocialPost、PlanSheet（颜色字体走 `theme` 参数） |
| [`blender`](packages/blender) | `blender` | 只有接口：参数 → 缓存键（FNV-1a 64，TS 与 Python 同一实现）、`BlenderSequence`、`run.py` |
| [`rig`](packages/rig) | `rig` | shining-rig，2D 角色骨骼库，自成一体，MIT（2026-11-07 从 Buer2333/shining-rig 连历史并入） |

示例：[`examples/hello-motion`](examples/hello-motion)，全部由代码绘制。

## 对象约定

一个「对象」是一个能在成片里复用的画面部件，必须满足：

1. 参数有类型：每个参数在 meta 里有 `name` / `type` / `default` / `note`
2. 帧号事件：触发时刻用「成片帧号」的 prop 表达（如 `at`），并列进 meta 的 `events`（每个 event 必须也在 `params` 里）
3. 有 preset：一组命名的参数组合（`presets`），调用方只覆盖差异
4. 有 meta：用 `defineObject({...})` 声明并校验（PascalCase 名字、合法 route、events 在 params 里、preset 名非空）

**meta 导出约定**：

- 每个对象文件导出 `meta = defineObject({...})`，和对象本身放在同一个文件。
- 包的 `src/index.ts` 把它改名汇总为 `<对象名>Meta`：`export { Dust, meta as DustMeta } from './Dust';`。
- `tools/build_meta.mjs` 收集每个包 index 里所有名字以 `Meta` 结尾的导出（rig 除外），逐个过 `defineObject`，要求 `meta.package` 等于目录名，同名对象报错退出。
- 没有对象的包（如 blender 目前只有接口）不导出 meta。

## 包间用相对路径 import

包之间 import 一律写相对路径，不写包名：

```ts
// packages/2d/src/Dust.tsx
import { hash } from '../../core/src/random';
```

原因：使用方（personal 工程）会把 `packages/<pkg>/src` 按原目录结构整份 vendor 过去，包名在那边解析不了，相对路径不用改 tsconfig 和 webpack。示例工程（`examples/*`）是消费者，可以用包名。

## 命令

```sh
npm install        # 根目录装一次，所有包共用
npm run typecheck  # 每个包 tsc --noEmit
npm test           # vitest
npm run meta       # 汇总各包 meta，生成 meta.json
npm run gallery    # 由 meta.json 生成 gallery/dist/index.html（不入库）
npm run stills -- <outDir> <CompId[@frame]> ...   # 用 @remotion/renderer 渲 gallery/remotion 里的样片 still（gl=angle）
npm run test:gl -- --out <dir>   # GLPasses 渲 still 并断言中心像素
bash packages/rig/tools/public_scan.sh   # 公开前扫描：packages/、gallery/、tools/、examples/、skills/
```

## 使用方接入

使用方（personal）按 tag 引用：库打 tag 后，把 `packages/*/src`（rig 除外）、`meta.json`、版本号 vendor 进自己的目录，再用 meta.json 校验引用的对象名。

## License

MIT。Remotion 自己有许可证，部分公司需要付费版本：见 [remotion.dev/license](https://www.remotion.dev/license)。
