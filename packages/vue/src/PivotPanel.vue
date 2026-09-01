<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { AGGREGATION_LABELS, type PivotField, type PivotFieldArea } from '@smartv/pivot-core'
import type { PivotStore } from '@smartv/pivot-core'
import type { PivotDragPayload } from './drag'
import PivotFieldAreaView from './PivotFieldArea.vue'
import PivotFieldList from './PivotFieldList.vue'
import PivotFilterView from './PivotFilter.vue'
import PivotValueField from './PivotValueField.vue'

const props = defineProps<{
  store: PivotStore
  onRefresh?: () => void
}>()

const snapshot = ref(props.store.getSnapshot())
const filterFields = ref(props.store.getFilterFields())

let unsubscribe: (() => void) | undefined

onMounted(() => {
  unsubscribe = props.store.subscribe(() => {
    snapshot.value = props.store.getSnapshot()
    filterFields.value = props.store.getFilterFields()
  })
})

onUnmounted(() => {
  unsubscribe?.()
})

const activeIds = computed(() => {
  const ids = new Set<string>()
  const { config, fields } = snapshot.value
  for (const field of config.rows) ids.add(field.id)
  for (const field of config.columns) ids.add(field.id)
  for (const field of filterFields.value) ids.add(field.id)
  for (const value of config.values) {
    const field = fields.find((item) => item.name === value.field)
    if (field) ids.add(field.id)
  }
  return ids
})

const rowItems = computed(() => snapshot.value.config.rows.map((field) => ({
  id: field.id,
  label: field.name,
})))

const columnItems = computed(() => snapshot.value.config.columns.map((field) => ({
  id: field.id,
  label: field.name,
})))

const filterItems = computed(() => filterFields.value.map((field) => ({
  id: field.id,
  label: field.name,
})))

const valueItems = computed(() => snapshot.value.config.values.map((value) => ({
  id: value.id,
  label: `${value.field} · ${AGGREGATION_LABELS[value.aggregation]}`,
})))

function findField(payload: PivotDragPayload | null): PivotField | undefined {
  if (!payload) return undefined
  const byId = snapshot.value.fields.find((field) => field.id === payload.fieldId || field.id === payload.itemId)
  if (byId) return byId
  const fromRows = snapshot.value.config.rows.find((field) => field.id === payload.itemId)
  if (fromRows) return fromRows
  const fromCols = snapshot.value.config.columns.find((field) => field.id === payload.itemId)
  if (fromCols) return fromCols
  return filterFields.value.find((field) => field.id === payload.itemId)
}

function handleDrop(area: PivotFieldArea, payload: PivotDragPayload | null, index?: number): void {
  if (!payload) return
  if (payload.from === area && payload.index !== undefined && index !== undefined) {
    props.store.reorder(area, payload.index, index)
    props.onRefresh?.()
    return
  }
  if (payload.from !== 'list' && payload.from !== area && payload.itemId) {
    props.store.removeField(payload.itemId, payload.from)
  }
  if (area === 'value' && payload.from === 'value' && payload.index !== undefined && index !== undefined) {
    props.store.reorder('value', payload.index, index)
    props.onRefresh?.()
    return
  }
  const field = findField(payload)
  if (!field) return
  props.store.addField(field, area, index)
  props.onRefresh?.()
}

function handleRemove(area: PivotFieldArea, id: string): void {
  props.store.removeField(id, area)
  props.onRefresh?.()
}

function handleToggle(field: PivotField, checked: boolean): void {
  if (!checked) {
    if (snapshot.value.config.rows.some((item) => item.id === field.id)) {
      props.store.removeField(field.id, 'row')
    } else if (snapshot.value.config.columns.some((item) => item.id === field.id)) {
      props.store.removeField(field.id, 'column')
    } else if (filterFields.value.some((item) => item.id === field.id)) {
      props.store.removeField(field.id, 'filter')
    } else {
      const value = snapshot.value.config.values.find((item) => item.field === field.name)
      if (value) props.store.removeField(value.id, 'value')
    }
    props.onRefresh?.()
    return
  }
  props.store.addField(field, field.type === 'number' ? 'value' : 'row')
  props.onRefresh?.()
}

function handleFilterChange(field: string, values: unknown[], type: 'include' | 'exclude' = 'include'): void {
  props.store.setFilter({ field, type, values })
  props.onRefresh?.()
}
</script>

<template>
  <aside class="pivot-panel">
    <h2>数据透视表字段</h2>

    <p v-if="snapshot.issue" class="pivot-panel__error">{{ snapshot.issue.userMessage }}</p>

    <section>
      <h3>字段</h3>
      <PivotFieldList
        :fields="snapshot.fields"
        :active-ids="activeIds"
        @toggle="handleToggle"
      />
    </section>

    <PivotFieldAreaView
      title="筛选"
      area="filter"
      :items="filterItems"
      @drop="(payload, index) => handleDrop('filter', payload, index)"
      @remove="(id) => handleRemove('filter', id)"
    />

    <PivotFilterView
      v-for="field in filterFields"
      :key="field.id"
      :field="field.name"
      :records="snapshot.records"
      :filter="snapshot.config.filters.find((item) => item.field === field.name)"
      @change="(filter) => handleFilterChange(filter.field, filter.values, filter.type)"
    />

    <PivotFieldAreaView
      title="列"
      area="column"
      :items="columnItems"
      @drop="(payload, index) => handleDrop('column', payload, index)"
      @remove="(id) => handleRemove('column', id)"
    />

    <PivotFieldAreaView
      title="行"
      area="row"
      :items="rowItems"
      @drop="(payload, index) => handleDrop('row', payload, index)"
      @remove="(id) => handleRemove('row', id)"
    />

    <PivotFieldAreaView
      title="值"
      area="value"
      :items="valueItems"
      @drop="(payload, index) => handleDrop('value', payload, index)"
      @remove="(id) => handleRemove('value', id)"
    />

    <div class="pivot-panel__values">
      <PivotValueField
        v-for="value in snapshot.config.values"
        :key="value.id"
        :value="value"
        @change="(aggregation) => { store.setAggregation(value.id, aggregation); onRefresh?.() }"
      />
    </div>

    <div class="pivot-panel__totals">
      <label>
        <input
          type="checkbox"
          :checked="snapshot.config.showRowGrandTotal"
          @change="store.setTotals({ showRowGrandTotal: ($event.target as HTMLInputElement).checked }); onRefresh?.()"
        >
        行总计
      </label>
      <label>
        <input
          type="checkbox"
          :checked="snapshot.config.showColumnGrandTotal"
          @change="store.setTotals({ showColumnGrandTotal: ($event.target as HTMLInputElement).checked }); onRefresh?.()"
        >
        列总计
      </label>
      <label>
        <input
          type="checkbox"
          :checked="snapshot.config.showSubtotals"
          @change="store.setTotals({ showSubtotals: ($event.target as HTMLInputElement).checked }); onRefresh?.()"
        >
        小计
      </label>
    </div>
  </aside>
</template>

<style scoped>
.pivot-panel {
  width: 320px;
  min-width: 280px;
  height: 100%;
  overflow: auto;
  padding: 12px;
  background: #fff;
  border-left: 1px solid #e4e7ec;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

h2 {
  margin: 0;
  font-size: 14px;
}

h3 {
  margin: 0 0 8px;
  font-size: 12px;
  color: #667085;
}

.pivot-panel__error {
  margin: 0;
  padding: 8px;
  border-radius: 6px;
  background: #fef3f2;
  color: #b42318;
  font-size: 12px;
}

.pivot-panel__values,
.pivot-panel__totals {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.pivot-panel__totals label {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
