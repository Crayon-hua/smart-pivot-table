# @smartv/pivot-vue

Vue 3 field panel for the pivot engine.

```bash
pnpm add @smartv/pivot-vue @smartv/pivot-core vue
```

`pinia` is optional and only needed if you use `usePivotStore`.

```vue
<script setup lang="ts">
import { PivotPanel } from '@smartv/pivot-vue'
import { PivotStore } from '@smartv/pivot-core'
</script>

<template>
  <PivotPanel :store="store" />
</template>
```

## License

Apache-2.0.
