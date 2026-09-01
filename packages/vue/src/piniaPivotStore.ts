import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { PivotStore } from '@smart/pivot-core'
import type { PivotStoreSnapshot } from '@smart/pivot-core'

export const usePivotStore = defineStore('smart-pivot', () => {
  const store = new PivotStore()
  const snapshot = ref<PivotStoreSnapshot>(store.getSnapshot())
  store.subscribe(() => {
    snapshot.value = store.getSnapshot()
  })

  const result = computed(() => snapshot.value.result)
  const fields = computed(() => snapshot.value.fields)
  const config = computed(() => snapshot.value.config)
  const issue = computed(() => snapshot.value.issue)
  const chartVisible = computed(() => snapshot.value.chartVisible)
  const chartType = computed(() => snapshot.value.chartType)

  return {
    store,
    snapshot,
    result,
    fields,
    config,
    issue,
    chartVisible,
    chartType,
  }
})
