# Smart Pivot Table

[English](README.md) | [中文](README_ZH.md)

面向 [Univer](https://univer.ai) 开源版的透视表 / 透视图。计算引擎与框架无关，Vue 和 Univer 只是适配层。

## 本地运行

```sh
pnpm install
pnpm dev
```

打开 [http://localhost:5173](http://localhost:5173)，点 **创建透视表**，再点 **创建透视图**。

## 包

| 包 | 作用 |
| --- | --- |
| `@smartv/pivot-core` | 透视引擎 |
| `@smartv/pivot-vue` | Vue 3 字段面板 |
| `@smartv/pivot-chart` | ECharts 透视图 |
| `@smartv/pivot-univer` | Univer OSS 读写与命令 |
| `@smartv/pivot-table` | 聚合导出 |

发版：五个 `packages/*/package.json` 的 `version` 改成同一个数，提交后打 `v*` tag 并推送（例如 `git tag v0.1.1 && git push origin v0.1.1`），由 GitHub Actions `Publish npm` 发布。

## License

[Apache-2.0](./LICENSE)
