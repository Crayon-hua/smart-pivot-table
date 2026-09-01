import { describe, expect, it } from 'vitest'
import { PivotChartAdapter } from './PivotChartAdapter'
import { createDefaultPivotConfig, type PivotField } from '@smartv/pivot-core'
import { PivotEngine } from '@smartv/pivot-core'

const region: PivotField = { id: 'field:地区', name: '地区', type: 'string' }
const product: PivotField = { id: 'field:产品', name: '产品', type: 'string' }

describe('PivotChartAdapter', () => {
  const result = new PivotEngine(
    [
      { 地区: '华东', 产品: 'A', 销售额: 300 },
      { 地区: '华东', 产品: 'B', 销售额: 300 },
      { 地区: '华南', 产品: 'A', 销售额: 400 },
      { 地区: '华南', 产品: 'B', 销售额: 500 },
    ],
    createDefaultPivotConfig({
      rows: [region],
      columns: [product],
      values: [{ id: 'v1', field: '销售额', aggregation: 'sum' }],
    }),
  ).calculate()

  it('builds bar chart categories from rows and series from columns', () => {
    const option = new PivotChartAdapter().toOption(result, { type: 'bar' })
    const xAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis
    expect(xAxis && 'data' in xAxis ? xAxis.data : []).toEqual(['华东', '华南'])
    expect(Array.isArray(option.series) ? option.series.length : 0).toBeGreaterThanOrEqual(2)
  })

  it('builds a pie chart without throwing', () => {
    const option = new PivotChartAdapter().toOption(result, { type: 'pie' })
    expect(Array.isArray(option.series) ? option.series[0]?.type : undefined).toBe('pie')
  })

  it('builds a line chart', () => {
    const option = new PivotChartAdapter().toOption(result, { type: 'line' })
    const series = Array.isArray(option.series) ? option.series : []
    expect(series[0] && 'type' in series[0] ? series[0].type : undefined).toBe('line')
  })
})
