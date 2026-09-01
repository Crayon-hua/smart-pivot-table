<script setup lang="ts">
import type { PivotField } from '@smartv/pivot-core'
import { writeDragPayload } from './drag'
import PivotFieldItem from './PivotFieldItem.vue'

defineProps<{
  fields: PivotField[]
  activeIds: Set<string>
}>()

const emit = defineEmits<{
  toggle: [field: PivotField, checked: boolean]
}>()

function onDragStart(field: PivotField, event: DragEvent): void {
  writeDragPayload(event, { from: 'list', fieldId: field.id })
}

function onToggle(field: PivotField, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked
  emit('toggle', field, checked)
}
</script>

<template>
  <div class="pivot-field-list">
    <label
      v-for="field in fields"
      :key="field.id"
      class="pivot-field-list__row"
    >
      <input
        type="checkbox"
        :checked="activeIds.has(field.id)"
        @change="onToggle(field, $event)"
      >
      <PivotFieldItem
        :label="field.name"
        @dragstart="onDragStart(field, $event)"
      />
    </label>
  </div>
</template>

<style scoped>
.pivot-field-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pivot-field-list__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pivot-field-list__row :deep(.pivot-field-item) {
  flex: 1;
}
</style>
