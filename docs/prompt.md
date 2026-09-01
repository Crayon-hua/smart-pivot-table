基于 Univer OSS 自研 Pivot Table + Pivot Chart

你现在是一个资深前端架构师和 TypeScript 开源项目开发者。

我要在现有项目中实现一个：

> **基于 Univer OSS 的开源 Pivot Table + Pivot Chart 插件**

目标是实现类似 Excel 数据透视表 / 数据透视图的核心能力，但**不能依赖 Univer Pro 的 Pivot Table 功能，也不能复制、反编译或移植 Univer Pro 的源码**。

请基于 Univer OSS 的公开 API 和我们自己的代码实现。

---

# 一、最终目标

最终项目结构：

```text
Vue3
  │
  ├── Univer OSS
  │
  └── @xxx/smart-pivot
          │
          ├── Pivot Engine
          ├── Pivot Model
          ├── Pivot Store
          ├── Pivot UI
          ├── Pivot Renderer
          └── Pivot Chart
                    │
                    └── ECharts
```

最终实现：

```text
Excel Sheet
    │
    │ 选择数据区域
    ▼
创建数据透视表
    │
    ▼
Pivot Table
    │
    ├── Rows
    ├── Columns
    ├── Values
    └── Filters
    │
    ▼
Pivot Result
    │
    ├───────────────┐
    ▼               ▼
Pivot Table      Pivot Chart
                    │
                    ▼
                 ECharts
```

---

# 二、重要限制

## 1. 禁止使用 Univer Pro

不要使用：

```text
@univerjs-pro/engine-pivot
@univerjs-pro/sheets-pivot
@univerjs-pro/sheets-pivot-ui
```

也不要通过任何方式绕过 Univer Pro license。

---

## 2. 禁止复制 Univer Pro 源码

可以：

* 阅读 Univer OSS 的公开 API
* 使用 Univer OSS 的公开 API
* 参考公开文档中的功能设计
* 自己设计 Pivot Engine
* 自己设计 Pivot UI

禁止：

* 复制 Univer Pro 源码
* 修改 Pro 源码后作为自己的实现
* 反编译 Pro 包
* 从 Pro 包中提取实现代码
* 删除 Pro license 后继续使用

我们的 Pivot Engine 必须是独立实现。

---

# 三、技术栈

必须使用：

```text
Vue 3
TypeScript
Vite
Univer OSS
ECharts
pnpm
```

如果当前项目已经存在技术栈，以当前项目为准，不要随意升级依赖。

Vue 使用：

```text
Composition API
<script setup lang="ts">
```

状态管理优先使用：

```text
Pinia
```

如果当前项目没有 Pinia，也可以先使用普通响应式 Store。

---

# 四、第一步：先分析现有项目

不要立即修改代码。

首先检查：

```text
package.json
pnpm-workspace.yaml
vite.config.*
tsconfig.*
src/
packages/
```

确认：

1. 当前是否是 Monorepo
2. 当前 Univer 版本
3. 当前 Vue 版本
4. 当前是否已经安装 ECharts
5. 当前是否已经存在组件库
6. 当前是否已经存在状态管理
7. 当前项目入口在哪里

然后输出：

```text
项目现状
依赖关系
现有架构
建议新增目录
需要修改的文件
```

确认之后再开始编码。

---

# 五、目标项目目录

建议最终目录：

```text
packages/
└── smart-pivot/
    │
    ├── src/
    │   │
    │   ├── core/
    │   │   ├── PivotEngine.ts
    │   │   ├── PivotModel.ts
    │   │   ├── PivotStore.ts
    │   │   ├── PivotTypes.ts
    │   │   ├── PivotAggregator.ts
    │   │   ├── PivotGrouper.ts
    │   │   ├── PivotFilter.ts
    │   │   ├── PivotSorter.ts
    │   │   └── PivotResult.ts
    │   │
    │   ├── univer/
    │   │   ├── UniverPivotPlugin.ts
    │   │   ├── UniverDataAdapter.ts
    │   │   ├── UniverRangeReader.ts
    │   │   └── UniverPivotRenderer.ts
    │   │
    │   ├── ui/
    │   │   ├── PivotPanel.vue
    │   │   ├── PivotFieldList.vue
    │   │   ├── PivotFieldArea.vue
    │   │   ├── PivotFieldItem.vue
    │   │   ├── PivotValueField.vue
    │   │   └── PivotFilter.vue
    │   │
    │   ├── chart/
    │   │   ├── PivotChart.vue
    │   │   ├── PivotChartEngine.ts
    │   │   └── PivotChartAdapter.ts
    │   │
    │   ├── utils/
    │   │   ├── groupBy.ts
    │   │   ├── aggregate.ts
    │   │   └── matrix.ts
    │   │
    │   └── index.ts
    │
    ├── tests/
    │   ├── PivotEngine.test.ts
    │   ├── PivotAggregator.test.ts
    │   ├── PivotFilter.test.ts
    │   └── PivotChartAdapter.test.ts
    │
    ├── package.json
    └── README.md
```

如果当前项目不是 Monorepo，不要强行创建 Monorepo。

---

# 六、核心数据模型

首先实现完整 TypeScript 类型。

## PivotField

```ts
export interface PivotField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown'
}
```

---

## PivotFieldArea

```ts
export type PivotFieldArea =
  | 'filter'
  | 'row'
  | 'column'
  | 'value'
```

---

## PivotAggregation

第一阶段支持：

```ts
export type PivotAggregation =
  | 'sum'
  | 'count'
  | 'avg'
  | 'min'
  | 'max'
```

后续可以扩展：

```text
median
distinctCount
stddev
variance
```

但第一阶段不要实现。

---

## PivotValue

```ts
export interface PivotValue {
  id: string
  field: string
  aggregation: PivotAggregation
  label?: string
}
```

---

## PivotFilter

```ts
export interface PivotFilter {
  field: string
  type: 'include' | 'exclude'
  values: unknown[]
}
```

---

## PivotConfig

```ts
export interface PivotConfig {
  source: {
    sheetId: string
    startRow: number
    startColumn: number
    endRow: number
    endColumn: number
  }

  rows: PivotField[]

  columns: PivotField[]

  values: PivotValue[]

  filters: PivotFilter[]

  showRowGrandTotal: boolean

  showColumnGrandTotal: boolean

  showSubtotals: boolean
}
```

---

# 七、Pivot Engine

核心文件：

```text
core/PivotEngine.ts
```

API：

```ts
class PivotEngine {
  constructor(data: Record<string, unknown>[], config: PivotConfig)

  calculate(): PivotResult
}
```

不要把 Pivot Engine 和 Vue 耦合。

Pivot Engine 必须：

```text
纯 TypeScript
无 Vue
无 DOM
无 ECharts
无 Univer
```

这样以后可以：

```text
Browser
Worker
Node.js
Server
```

都复用。

---

# 八、Pivot 计算流程

实现：

```text
原始数据
    ↓
Filter
    ↓
Group Rows
    ↓
Group Columns
    ↓
Aggregate
    ↓
Subtotal
    ↓
Grand Total
    ↓
PivotResult
```

例如：

原始数据：

```text
地区   产品   销售额
华东   A      100
华东   A      200
华东   B      300
华南   A      400
华南   B      500
```

配置：

```text
Rows:
地区

Columns:
产品

Values:
销售额 SUM
```

结果：

```text
        A      B      总计
华东    300    300     600
华南    400    500     900
总计    700    800    1500
```

必须正确处理：

```text
空值
数字字符串
NaN
Infinity
不存在字段
空数据
重复数据
```

---

# 九、PivotResult

设计成：

```ts
export interface PivotResult {
  rows: string[]
  columns: string[]

  headers: PivotHeader[]

  data: PivotCell[][]

  rowTotals?: PivotCell[]

  columnTotals?: PivotCell[]

  grandTotal?: PivotCell
}
```

不要让 UI 直接依赖 Engine 内部结构。

---

# 十、Aggregator

实现：

```text
SumAggregator
CountAggregator
AvgAggregator
MinAggregator
MaxAggregator
```

统一接口：

```ts
interface Aggregator {
  add(value: unknown): void

  result(): number | null
}
```

注意：

```text
SUM
COUNT
AVG
MIN
MAX
```

都必须正确处理：

```text
null
undefined
NaN
''
```

数字字符串是否转换成数字，请统一设计并写测试。

---

# 十一、Group By

实现通用：

```ts
groupBy()
```

支持：

```text
单字段
多字段
```

例如：

```text
地区
产品
```

形成：

```text
华东
 ├── A
 └── B

华南
 ├── A
 └── B
```

必须保证：

```text
group key 稳定
null 安全
undefined 安全
对象不会直接作为 key
```

---

# 十二、Filter

实现：

```text
Include
Exclude
```

例如：

```text
地区 = 华东
```

只保留：

```text
华东
```

支持多个值：

```text
华东
华南
```

不要在第一阶段实现复杂 Excel Filter UI。

先保证 Engine 正确。

---

# 十三、Sort

实现：

```text
文本排序
数字排序
```

后续再支持：

```text
按值排序
```

第一阶段可以先提供：

```ts
sortRows()
sortColumns()
```

---

# 十四、Subtotal

支持：

```text
showSubtotals
```

例如：

```text
华东
  A     100
  B     200
  小计   300

华南
  A     400
  B     500
  小计   900
```

如果实现复杂，可以第一阶段先完成 Grand Total，再实现 Subtotal。

但是代码结构必须预留。

---

# 十五、Grand Total

必须支持：

```text
Row Grand Total
Column Grand Total
```

配置：

```ts
showRowGrandTotal
showColumnGrandTotal
```

例如：

```text
        A      B      总计
华东    100    200     300
华南    300    400     700
----------------------------
总计    400    600    1000
```

---

# 十六、Univer Adapter

实现：

```text
univer/UniverDataAdapter.ts
```

负责：

```text
Univer Workbook
      ↓
Sheet
      ↓
Range
      ↓
二维数组
      ↓
Record<string, unknown>[]
```

例如：

```ts
const data = univerDataAdapter.readRange({
  sheetId,
  startRow,
  startColumn,
  endRow,
  endColumn
})
```

第一行默认作为字段名：

```text
日期 | 地区 | 产品 | 销售额
```

转换成：

```ts
[
  {
    日期: ...,
    地区: ...,
    产品: ...,
    销售额: ...
  }
]
```

---

# 十七、不要污染 Univer

不要修改 Univer 核心源码。

使用：

```text
Plugin
Service
Command
Event
```

等公开扩展机制。

我们的插件：

```ts
UniverPivotPlugin
```

负责：

```text
初始化 Pivot Store
注册 Pivot Commands
注册 Pivot UI
注册事件
```

---

# 十八、Pivot UI

使用 Vue3。

核心界面：

```text
┌──────────────────────────────┐
│ 数据透视表字段               │
├──────────────────────────────┤
│                              │
│ 字段                         │
│                              │
│ □ 日期                       │
│ □ 地区                       │
│ □ 产品                       │
│ □ 销售额                     │
│                              │
├──────────────────────────────┤
│ 筛选                         │
│                              │
│      地区                    │
│                              │
├──────────────────────────────┤
│ 列                           │
│                              │
│      产品                    │
│                              │
├──────────────────────────────┤
│ 行                           │
│                              │
│      地区                    │
│                              │
├──────────────────────────────┤
│ 值                           │
│                              │
│      销售额 · 求和           │
│                              │
└──────────────────────────────┘
```

---

# 十九、字段拖拽

使用 Vue 实现：

```text
字段列表
    ↓
Filter
Row
Column
Value
```

支持：

```text
drag
drop
remove
reorder
```

不要引入重量级拖拽库，除非项目已经存在。

可以先使用 HTML5 Drag and Drop。

---

# 二十、Value 字段

用户添加：

```text
销售额
```

默认：

```text
SUM
```

点击之后可以选择：

```text
求和
计数
平均值
最大值
最小值
```

UI：

```text
销售额
  └── 求和
       ├── 求和
       ├── 计数
       ├── 平均值
       ├── 最大值
       └── 最小值
```

---

# 二十一、Pivot Renderer

Pivot Engine 得到：

```text
PivotResult
```

然后 Renderer 把它写回 Univer Sheet。

不要让 Engine 直接操作 Univer。

结构：

```text
PivotEngine
     ↓
PivotResult
     ↓
UniverPivotRenderer
     ↓
Univer Sheet
```

这样后面可以增加：

```text
HTML Renderer
Canvas Renderer
Table Renderer
```

---

# 二十二、Pivot Chart

使用：

```text
ECharts
```

创建：

```text
chart/PivotChart.vue
```

支持：

```text
bar
line
pie
area
```

第一阶段：

```text
柱状图
折线图
饼图
```

---

# 二十三、PivotChartAdapter

不要让 ECharts 直接读取 PivotResult。

创建：

```ts
PivotChartAdapter
```

负责：

```text
PivotResult
      ↓
EChartsOption
```

例如：

```ts
interface PivotChartConfig {
  type: 'bar' | 'line' | 'pie'

  categoryField?: string

  seriesFields?: string[]

  valueField?: string
}
```

---

# 二十四、自动生成图表

例如：

```text
Rows:
地区

Columns:
产品

Values:
销售额
```

自动转换：

```text
X Axis:
地区

Series:
产品

Y Axis:
销售额
```

ECharts：

```ts
{
  xAxis: {
    type: 'category',
    data: [...]
  },

  yAxis: {
    type: 'value'
  },

  series: [...]
}
```

---

# 二十五、图表刷新

当：

```text
PivotConfig
```

变化时：

```text
PivotEngine.calculate()
       ↓
PivotResult 更新
       ↓
PivotChartAdapter
       ↓
ECharts setOption()
```

必须实现响应式更新。

不要每次创建新的 ECharts 实例。

---

# 二十六、大数据考虑

不要一开始追求极致性能，但是架构必须允许以后优化。

设计：

```text
PivotEngine
```

为纯函数/纯计算模块。

以后可以迁移：

```text
Main Thread
      ↓
Web Worker
```

结构：

```text
Vue
 │
 ▼
PivotWorkerClient
 │
 ▼
Web Worker
 │
 ▼
PivotEngine
```

所以不要在 PivotEngine 中使用：

```text
window
document
Vue reactive
ECharts
Univer
```

---

# 二十七、测试

必须使用当前项目已有的测试框架。

如果没有，则推荐：

```text
Vitest
```

至少实现以下测试：

## SUM

```text
100
200
300

=> 600
```

## COUNT

```text
A
B
C

=> 3
```

## AVG

```text
100
200
300

=> 200
```

## MIN

```text
100
200
300

=> 100
```

## MAX

```text
100
200
300

=> 300
```

## Row Pivot

```text
地区
华东
华东
华南

销售额
100
200
300
```

得到：

```text
华东 300
华南 300
```

## Row + Column Pivot

测试：

```text
地区 + 产品
```

## Grand Total

测试：

```text
Row Total
Column Total
Grand Total
```

## Filter

测试：

```text
地区 = 华东
```

## 空值

测试：

```text
null
undefined
''
NaN
```

## 多值字段

测试：

```text
SUM(销售额)
COUNT(销售额)
```

同时存在。

---

# 二十八、Demo 页面

创建一个 Demo：

```text
examples/pivot/
```

页面：

```text
┌───────────────────────────────────────────┐
│ Univer Pivot Demo                         │
├───────────────────────────────────────────┤
│                                           │
│ [创建透视表] [创建透视图] [刷新]          │
│                                           │
├──────────────────────────────┬────────────┤
│                              │            │
│                              │ Pivot      │
│          Univer              │ Panel      │
│                              │            │
│                              │            │
│                              │            │
└──────────────────────────────┴────────────┘
```

准备 Demo 数据：

```text
日期
地区
产品
销售额
数量
```

至少准备：

```text
1000 行
```

用于测试。

---

# 二十九、用户操作流程

必须支持：

```text
1. 打开 Univer

2. 选择数据区域

3. 点击“数据透视表”

4. 打开 Pivot Panel

5. 拖入：
   地区 → 行

6. 拖入：
   产品 → 列

7. 拖入：
   销售额 → 值

8. 自动计算

9. 把 PivotResult 渲染到 Sheet

10. 点击“透视图”

11. 选择柱状图

12. 自动生成 ECharts

13. 修改 Pivot 字段

14. Pivot Table 和 Pivot Chart 同步刷新
```

---

# 三十、错误处理

必须处理：

```text
源数据不存在
Range 不合法
字段为空
字段不存在
没有 Row
没有 Column
没有 Value
数据为空
聚合失败
ECharts 初始化失败
Sheet 不存在
```

错误不要直接：

```ts
throw new Error(...)
```

导致整个 Univer 崩溃。

应该提供：

```text
用户可见错误
开发者 console 错误
```

两套机制。

---

# 三十一、代码质量

要求：

```text
TypeScript strict
```

禁止：

```ts
any
```

除非第三方 Univer API 类型确实无法避免，并且必须加注释。

禁止：

```text
巨型文件
巨型 class
UI 中直接写 Pivot 算法
PivotEngine 中写 Vue
PivotEngine 中写 ECharts
PivotEngine 中写 Univer
```

必须遵循：

```text
Engine
Model
Adapter
Renderer
UI
Chart
```

职责分离。

---

# 三十二、API 设计

最终对外暴露：

```ts
export {
  PivotEngine,
  PivotModel,
  PivotStore,
  PivotChartAdapter,
  UniverPivotPlugin
}
```

以及：

```ts
export type {
  PivotConfig,
  PivotField,
  PivotValue,
  PivotFilter,
  PivotResult,
  PivotAggregation
}
```

---

# 三十三、未来扩展必须预留

不要第一阶段实现这些功能，但架构需要允许：

```text
日期分组
年
季度
月
周

数字分组

Top N

Value Filter

Distinct Count

Median

Variance

Standard Deviation

Drill Down

Calculated Field

Calculated Item

多个 Pivot Table

Pivot Cache

Pivot Chart

双轴

组合图
```

---

# 三十四、性能目标

第一阶段目标：

```text
10,000 行
100,000 行
```

保证正常运行。

不要过早优化。

但是避免：

```text
O(n²)
```

明显可以避免的情况。

对于：

```text
groupBy
aggregate
filter
```

尽量使用：

```text
Map
Set
```

不要频繁：

```text
Array.find()
Array.filter()
Array.reduce()
```

嵌套调用导致大量重复遍历。

---

# 三十五、开发顺序

严格按照以下顺序实现。

## Phase 1

```text
PivotTypes
PivotAggregator
PivotGrouper
PivotEngine
PivotResult
```

先完成纯 TS。

---

## Phase 2

```text
Filter
Sort
Grand Total
Subtotal
```

---

## Phase 3

```text
UniverDataAdapter
UniverPivotPlugin
UniverPivotRenderer
```

完成：

```text
Univer → PivotEngine → Univer
```

闭环。

---

## Phase 4

Vue：

```text
PivotPanel
PivotFieldList
PivotFieldArea
PivotValueField
```

---

## Phase 5

ECharts：

```text
PivotChart
PivotChartAdapter
```

---

## Phase 6

联动：

```text
Pivot Table
     ↕
Pivot Chart
```

---

## Phase 7

测试：

```text
Unit Test
Integration Test
Demo
```

---

# 三十六、非常重要：不要一次性生成所有代码

每个 Phase 完成后：

1. 修改代码
2. 运行 typecheck
3. 运行 lint
4. 运行 test
5. 修复问题
6. 输出修改文件
7. 输出测试结果
8. 再进入下一个 Phase

不要跳过测试。

---

# 三十七、Git 提交

每个 Phase 单独提交。

例如：

```text
feat(pivot): implement pivot engine
feat(pivot): add pivot aggregation
feat(pivot): add pivot filtering
feat(pivot): integrate with univer
feat(pivot): add pivot panel
feat(pivot): add pivot chart
test(pivot): add pivot engine tests
```

不要一次生成一个巨大的 commit。

---

# 三十八、最终验收标准

完成后必须满足：

```text
[✓] 不依赖 Univer Pro
[✓] 不复制 Univer Pro 源码
[✓] Pivot Engine 独立
[✓] Vue3 UI
[✓] Univer OSS 集成
[✓] SUM
[✓] COUNT
[✓] AVG
[✓] MIN
[✓] MAX
[✓] Row
[✓] Column
[✓] Filter
[✓] Grand Total
[✓] Subtotal
[✓] Pivot Result
[✓] ECharts
[✓] Bar Chart
[✓] Line Chart
[✓] Pie Chart
[✓] Pivot Table / Chart 联动
[✓] Unit Test
[✓] Demo
[✓] TypeScript strict
```

---

# 三十九、开始执行

现在不要直接写代码。

第一步：

1. 分析当前项目
2. 分析 Univer 版本
3. 分析 package.json
4. 分析项目目录
5. 找到 Univer 初始化代码
6. 找到 Vue 初始化代码
7. 确认当前构建方式

然后告诉我：

```text
## 项目现状

...

## Univer 现状

...

## 建议架构

...

## Phase 1 修改文件

...

## 潜在问题

...
```

在我确认后再开始 Phase 1。

如果当前项目结构已经足够明确，不需要反复询问我，直接按照上述架构推进。
