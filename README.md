# Smart Pivot Table

[English](README.md) | [中文](README_ZH.md)

[![License](https://img.shields.io/github/license/Crayon-hua/smart-pivot-table)](https://github.com/Crayon-hua/smart-pivot-table/blob/main/LICENSE)

Open-source **Pivot Table + Pivot Chart** for [Univer](https://univer.ai) OSS. The engine is framework-agnostic; Vue and Univer are adapters.

## Quick start

```sh
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Load the sample sheet, click **创建透视表**, then **创建透视图**.

```ts
import {
  PivotStore,
  PivotPanel,
  PivotChart,
  UniverPivotPlugin,
  createPivotUniverSession,
} from '@smartv/pivot-table'
```

Univer's sheet UI is React. The host app still needs `react`, `react-dom`, and `rxjs` as Univer peers. There is no Vue edition of `@univerjs/presets`.

## Packages

| Package | Role |
| --- | --- |
| [`@smartv/pivot-core`](./packages/core) | Engine: aggregate, filter, group, layout. No Vue / Univer. |
| [`@smartv/pivot-vue`](./packages/vue) | Vue 3 field panel. |
| [`@smartv/pivot-chart`](./packages/chart) | ECharts adapter + Vue chart. |
| [`@smartv/pivot-univer`](./packages/univer) | Univer OSS range reader / sheet writer / commands. |
| [`@smartv/pivot-table`](./packages/pivot-table) | Umbrella re-export. |

## Local development

This repo is a pnpm workspace.

```sh
pnpm install
pnpm dev          # playground
pnpm test
pnpm type-check
pnpm build
```

Publish: set the same `version` in every `packages/*/package.json`, commit, then tag and push (example `v0.1.1`). The `Publish npm` workflow runs on `v*` tags.

## License

[Apache-2.0](./LICENSE)
