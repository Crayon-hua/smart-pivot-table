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
| `@smart/pivot-core` | 透视引擎 |
| `@smart/pivot-vue` | Vue 3 字段面板 |
| `@smart/pivot-chart` | ECharts 透视图 |
| `@smart/pivot-univer` | Univer OSS 读写与命令 |
| `@smart/pivot-table` | 聚合导出 |

第一次发 npm：见 [docs/npm-first-publish.md](./docs/npm-first-publish.md)。

## License

[Apache-2.0](./LICENSE)
