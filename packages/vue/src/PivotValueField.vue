<script setup lang="ts">
import { computed, ref } from 'vue'
import { AGGREGATION_LABELS, type PivotAggregation, type PivotValue } from '@smartv/pivot-core'

const props = defineProps<{
  value: PivotValue
}>()

const emit = defineEmits<{
  change: [aggregation: PivotAggregation]
}>()

const open = ref(false)
const options: PivotAggregation[] = ['sum', 'count', 'avg', 'min', 'max']
const currentLabel = computed(() => AGGREGATION_LABELS[props.value.aggregation])

function select(aggregation: PivotAggregation): void {
  emit('change', aggregation)
  open.value = false
}
</script>

<template>
  <div class="pivot-value-field">
    <button type="button" class="pivot-value-field__trigger" @click="open = !open">
      {{ value.field }} · {{ currentLabel }}
    </button>
    <ul v-if="open" class="pivot-value-field__menu">
      <li v-for="option in options" :key="option">
        <button type="button" @click="select(option)">
          {{ AGGREGATION_LABELS[option] }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pivot-value-field {
  position: relative;
}

.pivot-value-field__trigger {
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 4px;
  background: #fff;
  padding: 4px 8px;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
}

.pivot-value-field__menu {
  position: absolute;
  z-index: 8;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  box-shadow: 0 8px 16px rgb(16 24 40 / 8%);
}

.pivot-value-field__menu button {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 12px;
}

.pivot-value-field__menu button:hover {
  background: #f2f4f7;
}
</style>
