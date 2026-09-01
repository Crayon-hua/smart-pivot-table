<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreZhCN from '@univerjs/preset-sheets-core/locales/zh-CN'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-sheets-core/lib/index.css'
import {
  PivotChart,
  PivotPanel,
  PivotStore,
  UniverPivotPlugin,
  createPivotUniverSession,
  type PivotChartType,
  type PivotUniverSession,
  type UniverFacadeLike,
} from '@smartv/pivot-table'
import { createDemoWorkbookData } from './demo-data'

const univerEl = ref<HTMLDivElement | null>(null)
const store = new PivotStore()
const session = shallowRef<PivotUniverSession | null>(null)
const snapshot = ref(store.getSnapshot())
const message = ref('选择源数据区域后，点击“创建透视表”。')
let disposeUniver: (() => void) | undefined

store.subscribe(() => {
  snapshot.value = store.getSnapshot()
})

onMounted(() => {
  if (!univerEl.value) {
    message.value = '无法初始化表格容器'
    return
  }

  const { univer, univerAPI } = createUniver({
    locale: LocaleType.ZH_CN,
    locales: {
      [LocaleType.ZH_CN]: mergeLocales(UniverPresetSheetsCoreZhCN),
    },
    presets: [
      UniverSheetsCorePreset({
        container: univerEl.value,
      }),
    ],
    plugins: [UniverPivotPlugin],
  })

  univerAPI.createWorkbook(createDemoWorkbookData())
  session.value = createPivotUniverSession(univerAPI as unknown as UniverFacadeLike, store)

  disposeUniver = () => {
    univer.dispose()
  }
  message.value = '已加载 1000 行示例数据。请选择 A1:E1001 或直接创建透视表。'
})

onBeforeUnmount(() => {
  disposeUniver?.()
})

function createTable(): void {
  const ok = session.value?.createFromSelection(true) ?? false
  message.value = ok ? '已创建透视表，结果写入“透视表”工作表。可继续拖拽字段。' : store.getIssue()?.userMessage ?? '创建透视表失败'
}

function createChart(): void {
  const ok = session.value?.showChart() ?? false
  message.value = ok ? '已创建透视图，修改字段后表格与图表会同步刷新。' : store.getIssue()?.userMessage ?? '创建透视图失败'
}

function refresh(): void {
  const ok = session.value?.refresh() ?? false
  message.value = ok ? '已刷新透视表。' : store.getIssue()?.userMessage ?? '刷新失败'
}

function onPanelRefresh(): void {
  session.value?.refresh()
}

function onChartType(type: PivotChartType): void {
  store.setChartType(type)
}
</script>

<template>
  <div class="demo">
    <header class="demo__header">
      <div>
        <h1>Univer Pivot Demo</h1>
        <p>{{ message }}</p>
      </div>
      <div class="demo__actions">
        <button type="button" @click="createTable">创建透视表</button>
        <button type="button" @click="createChart">创建透视图</button>
        <button type="button" class="is-ghost" @click="refresh">刷新</button>
      </div>
    </header>

    <div class="demo__body">
      <div class="demo__sheet">
        <div ref="univerEl" class="demo__univer" />
        <PivotChart
          v-if="snapshot.chartVisible"
          :result="snapshot.result"
          :type="snapshot.chartType"
          @update:type="onChartType"
        />
      </div>
      <PivotPanel :store="store" :on-refresh="onPanelRefresh" />
    </div>
  </div>
</template>

<style scoped>
.demo {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f2f4f7;
}

.demo__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ec;
}

h1 {
  margin: 0;
  font-size: 16px;
}

p {
  margin: 4px 0 0;
  color: #667085;
  font-size: 12px;
}

.demo__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

button {
  border: 1px solid #2f6fed;
  background: #2f6fed;
  color: #fff;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}

button.is-ghost {
  background: #fff;
  color: #344054;
  border-color: #d0d5dd;
}

.demo__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.demo__sheet {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.demo__univer {
  flex: 1;
  min-height: 0;
}
</style>
