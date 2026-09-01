import { describe, expect, it } from 'vitest'
import { createDefaultPivotConfig, type PivotField } from './PivotTypes'
import { PivotEngine } from './PivotEngine'

const region: PivotField = { id: 'field:地区', name: '地区', type: 'string' }
const product: PivotField = { id: 'field:产品', name: '产品', type: 'string' }

const sample = [
  { 地区: '华东', 产品: 'A', 销售额: 100 },
  { 地区: '华东', 产品: 'A', 销售额: 200 },
  { 地区: '华东', 产品: 'B', 销售额: 300 },
  { 地区: '华南', 产品: 'A', 销售额: 400 },
  { 地区: '华南', 产品: 'B', 销售额: 500 },
]

describe('PivotEngine', () => {
  it('pivots by row', () => {
    const result = new PivotEngine(
      [
        { 地区: '华东', 销售额: 100 },
        { 地区: '华东', 销售额: 200 },
        { 地区: '华南', 销售额: 300 },
      ],
      createDefaultPivotConfig({
        rows: [region],
        values: [{ id: 'v1', field: '销售额', aggregation: 'sum' }],
        showColumnGrandTotal: false,
        showRowGrandTotal: false,
      }),
    ).calculate()

    expect(result.rows).toEqual(['华东', '华南'])
    expect(result.data.map((row) => row[0]?.value)).toEqual([300, 300])
  })

  it('pivots by row and column with grand totals', () => {
    const result = new PivotEngine(
      sample,
      createDefaultPivotConfig({
        rows: [region],
        columns: [product],
        values: [{ id: 'v1', field: '销售额', aggregation: 'sum' }],
      }),
    ).calculate()

    expect(result.rows.slice(0, 2)).toEqual(['华东', '华南'])
    expect(result.columns[0]).toBe('A')
    expect(result.columns[1]).toBe('B')
    expect(result.data[0]?.[0]?.value).toBe(300)
    expect(result.data[0]?.[1]?.value).toBe(300)
    expect(result.data[1]?.[0]?.value).toBe(400)
    expect(result.data[1]?.[1]?.value).toBe(500)
    expect(result.grandTotal?.value).toBe(1500)
    expect(result.rowTotals?.[0]?.value).toBe(600)
    expect(result.rowTotals?.[1]?.value).toBe(900)
    expect(result.columnTotals?.[0]?.value).toBe(700)
    expect(result.columnTotals?.[1]?.value).toBe(800)
    expect(result.rows.at(-1)).toBe('总计')
  })

  it('supports multiple value fields', () => {
    const result = new PivotEngine(
      sample,
      createDefaultPivotConfig({
        rows: [region],
        values: [
          { id: 'v1', field: '销售额', aggregation: 'sum' },
          { id: 'v2', field: '销售额', aggregation: 'count' },
        ],
        showColumnGrandTotal: false,
        showRowGrandTotal: false,
      }),
    ).calculate()

    const east = result.data[result.rows.indexOf('华东')]
    expect(east?.[0]?.value).toBe(600)
    expect(east?.[1]?.value).toBe(3)
  })

  it('adds subtotals for nested rows', () => {
    const result = new PivotEngine(
      sample,
      createDefaultPivotConfig({
        rows: [region, product],
        values: [{ id: 'v1', field: '销售额', aggregation: 'sum' }],
        showColumnGrandTotal: false,
        showRowGrandTotal: false,
        showSubtotals: true,
      }),
    ).calculate()

    expect(result.rows.some((label) => label.includes('小计'))).toBe(true)
    const eastSubtotal = result.rows.findIndex((label) => label === '华东 小计')
    expect(result.data[eastSubtotal]?.[0]?.value).toBe(600)
  })

  it('returns a user-facing issue without throwing when values are missing', () => {
    const result = new PivotEngine(sample, createDefaultPivotConfig({ rows: [region] })).calculate()
    expect(result.data).toEqual([])
    expect(result.issues?.some((issue) => issue.code === 'NO_VALUE_FIELD')).toBe(true)
  })

  it('handles empty source data', () => {
    const result = new PivotEngine(
      [],
      createDefaultPivotConfig({
        rows: [region],
        values: [{ id: 'v1', field: '销售额', aggregation: 'sum' }],
      }),
    ).calculate()
    expect(result.issues?.some((issue) => issue.code === 'EMPTY_DATA')).toBe(true)
  })
})
