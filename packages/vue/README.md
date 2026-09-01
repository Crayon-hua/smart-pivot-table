# @smart/pivot-vue

Vue 3 field panel for the pivot engine.

```bash
pnpm add @smart/pivot-vue @smart/pivot-core vue
```

`pinia` is optional and only needed if you use `usePivotStore`.

```vue
<script setup lang="ts">
import { PivotPanel } from '@smart/pivot-vue'
import { PivotStore } from '@smart/pivot-core'
</script>

<template>
  <PivotPanel :store="store" />
</template>
```

## License

Apache-2.0.
