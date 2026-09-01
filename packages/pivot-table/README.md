# @smartv/pivot-table

Umbrella package: re-exports the pivot engine, Vue panel, ECharts chart, and Univer OSS adapter.

```bash
pnpm add @smartv/pivot-table vue
```

Install peers as needed:

- Univer sheet integration: `@univerjs/core` (and the host app's Univer presets; they need `react`, `react-dom`, `rxjs`)
- Chart: `echarts`
- Optional Pinia helper: `pinia`

```ts
import {
  PivotStore,
  PivotPanel,
  PivotChart,
  UniverPivotPlugin,
  createPivotUniverSession,
} from '@smartv/pivot-table'
```

## License

Apache-2.0.
