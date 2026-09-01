import { describe, expect, it } from 'vitest'
import { applyPivotFilters } from './PivotFilter'
import { createDefaultPivotConfig, type PivotField } from './PivotTypes'
import { PivotEngine } from './PivotEngine'

const region: PivotField = { id: 'field:地区', name: '地区', type: 'string' }

describe('PivotFilter', () => {
  const records = [
    { 地区: '华东', 销售额: 100 },
    { 地区: '华南', 销售额: 200 },
    { 地区: '华东', 销售额: 50 },
  ]

  it('includes 华东 only', () => {
    const filtered = applyPivotFilters(records, [{ field: '地区', type: 'include', values: ['华东'] }])
    expect(filtered).toHaveLength(2)
    expect(filtered.every((row) => row.地区 === '华东')).toBe(true)
  })

  it('excludes 华东', () => {
    const filtered = applyPivotFilters(records, [{ field: '地区', type: 'exclude', values: ['华东'] }])
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.地区).toBe('华南')
  })

  it('treats empty include values as no-op', () => {
    const filtered = applyPivotFilters(records, [{ field: '地区', type: 'include', values: [] }])
    expect(filtered).toHaveLength(3)
  })

  it('filters inside the engine', () => {
    const result = new PivotEngine(
      records,
      createDefaultPivotConfig({
        rows: [region],
        values: [{ id: 'v1', field: '销售额', aggregation: 'sum' }],
        filters: [{ field: '地区', type: 'include', values: ['华东'] }],
        showColumnGrandTotal: false,
        showRowGrandTotal: false,
      }),
    ).calculate()
    expect(result.rows).toEqual(['华东'])
    expect(result.data[0]?.[0]?.value).toBe(150)
  })
})
