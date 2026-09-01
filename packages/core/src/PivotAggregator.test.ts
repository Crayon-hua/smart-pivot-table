import { describe, expect, it } from 'vitest'
import { createAggregator } from './PivotAggregator'

describe('PivotAggregator', () => {
  it('sums numbers to 600', () => {
    const aggregator = createAggregator('sum')
    aggregator.add(100)
    aggregator.add(200)
    aggregator.add(300)
    expect(aggregator.result()).toBe(600)
  })

  it('counts non-blank values', () => {
    const aggregator = createAggregator('count')
    aggregator.add('A')
    aggregator.add('B')
    aggregator.add('C')
    expect(aggregator.result()).toBe(3)
  })

  it('averages numbers to 200', () => {
    const aggregator = createAggregator('avg')
    aggregator.add(100)
    aggregator.add(200)
    aggregator.add(300)
    expect(aggregator.result()).toBe(200)
  })

  it('finds min 100', () => {
    const aggregator = createAggregator('min')
    aggregator.add(100)
    aggregator.add(200)
    aggregator.add(300)
    expect(aggregator.result()).toBe(100)
  })

  it('finds max 300', () => {
    const aggregator = createAggregator('max')
    aggregator.add(100)
    aggregator.add(200)
    aggregator.add(300)
    expect(aggregator.result()).toBe(300)
  })

  it('skips null undefined empty NaN and Infinity for numeric aggregations', () => {
    for (const type of ['sum', 'avg', 'min', 'max'] as const) {
      const aggregator = createAggregator(type)
      aggregator.add(null)
      aggregator.add(undefined)
      aggregator.add('')
      aggregator.add(Number.NaN)
      aggregator.add(Number.POSITIVE_INFINITY)
      aggregator.add(10)
      expect(aggregator.result()).toBe(10)
    }
  })

  it('parses numeric strings', () => {
    const aggregator = createAggregator('sum')
    aggregator.add('100')
    aggregator.add(' 200 ')
    expect(aggregator.result()).toBe(300)
  })

  it('count ignores blank and NaN', () => {
    const aggregator = createAggregator('count')
    aggregator.add(null)
    aggregator.add(undefined)
    aggregator.add('')
    aggregator.add(Number.NaN)
    aggregator.add('A')
    expect(aggregator.result()).toBe(1)
  })
})
