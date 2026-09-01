# 第一次发版到 npmjs（手动）

第一次发布请在本机执行，不要用 GitHub Actions。CI 的 `publish.yml` 留给 **第二次及以后**（打 `v*` tag）。

目标包：

| 包名 | 目录 |
| --- | --- |
| `@smart/pivot-core` | `packages/core` |
| `@smart/pivot-vue` | `packages/vue` |
| `@smart/pivot-chart` | `packages/chart` |
| `@smart/pivot-univer` | `packages/univer` |
| `@smart/pivot-table` | `packages/pivot-table` |

当前版本约定：五个包都是 **`0.1.0`**，必须一起发。

## 1. 账号与组织

1. 注册并登录 [npmjs.com](https://www.npmjs.com/)。
2. 开启 **2FA**（发 scoped 包几乎必开）。
3. 创建或加入 Organization **`smart`**（scope 就是包名里的 `@smart`）：
   - [Create an Organization](https://www.npmjs.com/org/create)
   - 若 `smart` 已被占用，不能用这个 scope，需要先改包名再发。
4. 确认你对该 org 有 **publish** 权限。

检查名字是否空闲：

```bash
npm view @smart/pivot-core
npm view @smart/pivot-table
```

返回 `404` / `E404` 才说明还没人占。

## 2. 登录本机 npm

不要把 token 写进仓库。

```bash
npm login --registry=https://registry.npmjs.org
npm whoami
```

若走 Granular Access Token：

1. npmjs → Access Tokens → Generate New Token → **Granular Access Token**
2. 权限勾选 **Read and write**
3. 组织选 `smart`，包选 `pivot-*`（或整个 org）
4. 本机：

```bash
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
```

发完后删掉这条 config，或用 `npm logout`。

## 3. 构建校验

在仓库根目录：

```bash
cd D:\dev\workspace\smart-pivot-table
pnpm install
pnpm test
pnpm type-check
pnpm build
```

五项都要绿。`packages/*/dist` 会生成，且 `package.json` 的 `files` 只包含 `LICENSE` + `dist`。

核对版本（五个包必须相同）：

```bash
node -p "['core','vue','chart','univer','pivot-table'].map(n => n + ' ' + require('./packages/' + n + '/package.json').version).join('\n')"
```

应全部为 `0.1.0`。

## 4. 先 dry-run

按依赖顺序，**先 core，最后 umbrella**：

```bash
pnpm --filter @smart/pivot-core publish --dry-run --access public --no-git-checks --no-provenance --registry=https://registry.npmjs.org
pnpm --filter @smart/pivot-vue publish --dry-run --access public --no-git-checks --no-provenance --registry=https://registry.npmjs.org
pnpm --filter @smart/pivot-chart publish --dry-run --access public --no-git-checks --no-provenance --registry=https://registry.npmjs.org
pnpm --filter @smart/pivot-univer publish --dry-run --access public --no-git-checks --no-provenance --registry=https://registry.npmjs.org
pnpm --filter @smart/pivot-table publish --dry-run --access public --no-git-checks --no-provenance --registry=https://registry.npmjs.org
```

看输出里的 tarball 内容：应有 `dist/` 和 `LICENSE`，不应有 `src/`、`node_modules/`、测试文件。

每个包的 `prepublishOnly` 会再跑一遍 type-check + build，属正常。

## 5. 真正发布

确认 dry-run 无误后，一次性发五个包：

```bash
pnpm publish:only
```

等价于按顺序执行各包的 `publish:only`（`--access public --no-git-checks --no-provenance`）。

scoped 包默认是 restricted，**必须** `--access public`，否则会发成付费私有包或直接失败。

第一次不要加 `--provenance`。Provenance 需要在 GitHub Actions 里用 OIDC（`id-token: write`），本机手动发没有这份证明。

## 6. 验收

```bash
npm view @smart/pivot-table version
npm view @smart/pivot-table dependencies
```

浏览器打开：

- https://www.npmjs.com/package/@smart/pivot-table
- https://www.npmjs.com/package/@smart/pivot-core

空目录试装：

```bash
mkdir %TEMP%\pivot-smoke && cd %TEMP%\pivot-smoke
npm init -y
npm install @smart/pivot-table vue
```

## 7. 失败时怎么处理

| 现象 | 处理 |
| --- | --- |
| `ENEEDAUTH` / 401 | 重新 `npm login`，检查 token 是否过期、org 权限 |
| `403` You do not have permission | 没加入 `smart` org，或包名已被别人占用 |
| `402` paid private | 漏了 `--access public` |
| 只发了 core，后面失败 | 不要改已发布的 `0.1.0` 内容。修完把**五个包**一起升到 `0.1.1` 再发。npm 不允许覆盖已发布版本 |
| 发错内容 | 72 小时内可 `npm unpublish @smart/pivot-core@0.1.0`（仅限无依赖、时间窗口内）。更稳妥是发 `0.1.1`  deprecate `0.1.0` |

**不要**对已发布版本 `npm publish --force`。

## 8. 第一次发完之后（以后用 GitHub）

1. GitHub repo → Settings → Secrets and variables → Actions，加 `NPM_TOKEN`（Automation 或 Granular，write）。
2. Settings → Environments，建 **`npm`**，workflow 里已经写了 `environment: npm`。
3. 以后升版本：五个 `packages/*/package.json` 的 `version` 改成同一个数，例如 `0.1.1`。
4. 提交后打 tag 并推送：

```bash
git tag v0.1.1
git push origin v0.1.1
```

`.github/workflows/publish.yml` 会在 tag `v*` 时构建并带 provenance 发布。tag 去掉 `v` 必须等于 `@smart/pivot-table` 的 `version`。

第一次手动发版**不要**推 `v0.1.0` tag，否则 Actions 会再发一次同版本，npm 会拒绝。
