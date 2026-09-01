<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { PivotChartType, PivotResult } from '@smartv/pivot-core'
import { PivotChartEngine } from './PivotChartEngine'
import { createPivotIssue, reportPivotIssue } from '@smartv/pivot-core'

const props = defineProps<{
  result: PivotResult | null
  type: PivotChartType
}>()

const emit = defineEmits<{
  'update:type': [type: PivotChartType]
  error: [message: string]
}>()

const el = ref<HTMLDivElement | null>(null)
const engine = new PivotChartEngine()
let chart: echarts.ECharts | null = null

function render(): void {
  if (!chart) return
  if (!props.result) {
    chart.clear()
    return
  }
  try {
    chart.setOption(engine.buildOption(props.result, { type: props.type }), true)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    reportPivotIssue(createPivotIssue('CHART_INIT_FAILED', message, '图表刷新失败'))
    emit('error', '图表刷新失败')
  }
}

onMounted(() => {
  if (!el.value) {
    reportPivotIssue(createPivotIssue('CHART_INIT_FAILED', 'Chart container missing', '图表初始化失败'))
    emit('error', '图表初始化失败')
    return
  }
  try {
    chart = echarts.init(el.value)
    render()
    window.addEventListener('resize', resize)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    reportPivotIssue(createPivotIssue('CHART_INIT_FAILED', message, '图表初始化失败'))
    emit('error', '图表初始化失败')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})

watch(() => [props.result, props.type], render, { deep: true })

function resize(): void {
  chart?.resize()
}
</script>

<template>
  <section class="pivot-chart">
    <header>
      <strong>透视图</strong>
      <select :value="type" @change="emit('update:type', ($event.target as HTMLSelectElement).value as PivotChartType)">
        <option value="bar">柱状图</option>
        <option value="line">折线图</option>
        <option value="pie">饼图</option>
      </select>
    </header>
    <div ref="el" class="pivot-chart__canvas" />
  </section>
</template>

<style scoped>
.pivot-chart {
  height: 280px;
  border-top: 1px solid #e4e7ec;
  background: #fff;
  display: flex;
  flex-direction: column;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
}

.pivot-chart__canvas {
  flex: 1;
  min-height: 0;
}
</style>
