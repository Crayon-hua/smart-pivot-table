<script setup lang="ts">
import { computed } from 'vue'
import { displayValue, uniqueFieldValues, type PivotFilter } from '@smartv/pivot-core'

const props = defineProps<{
  field: string
  records: Record<string, unknown>[]
  filter?: PivotFilter
}>()

const emit = defineEmits<{
  change: [filter: PivotFilter]
}>()

const options = computed(() => uniqueFieldValues(props.records, props.field))
const selected = computed(() => new Set((props.filter?.values ?? []).map((value) => String(value))))

function onChange(event: Event): void {
  const select = event.target as HTMLSelectElement
  const values = [...select.selectedOptions].map((option) => options.value[Number(option.value)] ?? option.value)
  emit('change', {
    field: props.field,
    type: 'include',
    values,
  })
}

function optionValue(index: number): string {
  return String(index)
}
</script>

<template>
  <label class="pivot-filter">
    <span>{{ field }}</span>
    <select multiple :value="[]" @change="onChange">
      <option
        v-for="(option, index) in options"
        :key="optionValue(index)"
        :value="index"
        :selected="selected.has(String(option))"
      >
        {{ displayValue(option) }}
      </option>
    </select>
    <small>留空表示不过滤。按住 Ctrl 可多选。</small>
  </label>
</template>

<style scoped>
.pivot-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #344054;
}

.pivot-filter select {
  min-height: 72px;
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  padding: 4px;
}

.pivot-filter small {
  color: #98a2b3;
}
</style>
