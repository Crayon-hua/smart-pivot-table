<script setup lang="ts">
defineProps<{
  label: string
  meta?: string
  removable?: boolean
}>()

const emit = defineEmits<{
  dragstart: [event: DragEvent]
  remove: []
}>()

function onDragStart(event: DragEvent): void {
  emit('dragstart', event)
}
</script>

<template>
  <div
    class="pivot-field-item"
    draggable="true"
    @dragstart="onDragStart"
  >
    <span class="pivot-field-item__label">{{ label }}</span>
    <span v-if="meta" class="pivot-field-item__meta">{{ meta }}</span>
    <button
      v-if="removable"
      type="button"
      class="pivot-field-item__remove"
      aria-label="移除字段"
      @click.stop="emit('remove')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.pivot-field-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  background: #fff;
  cursor: grab;
  user-select: none;
  font-size: 12px;
  color: #1d2939;
}

.pivot-field-item:active {
  cursor: grabbing;
}

.pivot-field-item__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pivot-field-item__meta {
  color: #667085;
}

.pivot-field-item__remove {
  border: 0;
  background: transparent;
  color: #98a2b3;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}

.pivot-field-item__remove:hover {
  color: #d92d20;
}
</style>
