import type { EChartsOption } from 'echarts'
import type { PivotChartConfig, PivotResult } from '@smartv/pivot-core'
import { PivotChartAdapter } from './PivotChartAdapter'

export class PivotChartEngine {
  private readonly adapter = new PivotChartAdapter()

  buildOption(result: PivotResult, config: PivotChartConfig): EChartsOption {
    const option = this.adapter.toOption(result, config)
    return {
      color: ['#2f6fed', '#f5a524', '#12b76a', '#ee5d50', '#7a5af8', '#15b79e'],
      ...option,
    }
  }
}
