<script setup lang="ts">
import { ref } from 'vue'
import type { PivotFieldArea } from '@smartv/pivot-core'
import { readDragPayload, writeDragPayload } from './drag'
import PivotFieldItem from './PivotFieldItem.vue'

const props = defineProps<{
  title: string
  area: PivotFieldArea
  items: Array<{ id: string; label: string; meta?: string }>
}>()

const emit = defineEmits<{
  drop: [payload: ReturnType<typeof readDragPayload>, index?: number]
  remove: [id: string]
  reorder: [fromIndex: number, toIndex: number]
  click: [id: string]
}>()

const over = ref(false)

function onDragOver(event: DragEvent): void {
  event.preventDefault()
  over.value = true
}

function onDrop(event: DragEvent, index?: number): void {
  event.preventDefault()
  over.value = false
  emit('drop', readDragPayload(event), index)
}

function onItemDragStart(id: string, index: number, event: DragEvent): void {
  writeDragPayload(event, { from: props.area, itemId: id, index })
}
</script>

<template>
  <section
    class="pivot-field-area"
    :class="{ 'is-over': over }"
    @dragover="onDragOver"
    @dragleave="over = false"
    @drop="onDrop($event)"
  >
    <header class="pivot-field-area__title">{{ title }}</header>
    <div class="pivot-field-area__body">
      <PivotFieldItem
        v-for="(item, index) in items"
        :key="item.id"
        :label="item.label"
        :meta="item.meta"
        removable
        @dragstart="onItemDragStart(item.id, index, $event)"
        @remove="emit('remove', item.id)"
        @click="emit('click', item.id)"
      />
      <p v-if="items.length === 0" class="pivot-field-area__empty">拖入字段</p>
    </div>
  </section>
</template>

<style scoped>
.pivot-field-area {
  border: 1px dashed #d0d5dd;
  border-radius: 6px;
  padding: 8px;
  background: #f9fafb;
  min-height: 72px;
}

.pivot-field-area.is-over {
  border-color: #2f6fed;
  background: #eff4ff;
}

.pivot-field-area__title {
  font-size: 12px;
  font-weight: 600;
  color: #344054;
  margin-bottom: 6px;
}

.pivot-field-area__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pivot-field-area__empty {
  margin: 0;
  font-size: 12px;
  color: #98a2b3;
}
</style>
