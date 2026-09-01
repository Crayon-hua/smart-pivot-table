import { isBlankValue, toFiniteNumber } from './utils/aggregate'
import type { PivotAggregation } from './PivotTypes'

export interface Aggregator {
  add(value: unknown): void
  result(): number | null
  clone(): Aggregator
}

export class SumAggregator implements Aggregator {
  private total = 0
  private count = 0

  add(value: unknown): void {
    const number = toFiniteNumber(value)
    if (number === null) {
      return
    }
    this.total += number
    this.count += 1
  }

  result(): number | null {
    return this.count === 0 ? null : this.total
  }

  clone(): Aggregator {
    return new SumAggregator()
  }
}

export class CountAggregator implements Aggregator {
  private count = 0

  add(value: unknown): void {
    if (isBlankValue(value)) {
      return
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
      return
    }
    this.count += 1
  }

  result(): number | null {
    return this.count
  }

  clone(): Aggregator {
    return new CountAggregator()
  }
}

export class AvgAggregator implements Aggregator {
  private total = 0
  private count = 0

  add(value: unknown): void {
    const number = toFiniteNumber(value)
    if (number === null) {
      return
    }
    this.total += number
    this.count += 1
  }

  result(): number | null {
    if (this.count === 0) {
      return null
    }
    return this.total / this.count
  }

  clone(): Aggregator {
    return new AvgAggregator()
  }
}

export class MinAggregator implements Aggregator {
  private min: number | null = null

  add(value: unknown): void {
    const number = toFiniteNumber(value)
    if (number === null) {
      return
    }
    this.min = this.min === null ? number : Math.min(this.min, number)
  }

  result(): number | null {
    return this.min
  }

  clone(): Aggregator {
    return new MinAggregator()
  }
}

export class MaxAggregator implements Aggregator {
  private max: number | null = null

  add(value: unknown): void {
    const number = toFiniteNumber(value)
    if (number === null) {
      return
    }
    this.max = this.max === null ? number : Math.max(this.max, number)
  }

  result(): number | null {
    return this.max
  }

  clone(): Aggregator {
    return new MaxAggregator()
  }
}

export function createAggregator(aggregation: PivotAggregation): Aggregator {
  switch (aggregation) {
    case 'sum':
      return new SumAggregator()
    case 'count':
      return new CountAggregator()
    case 'avg':
      return new AvgAggregator()
    case 'min':
      return new MinAggregator()
    case 'max':
      return new MaxAggregator()
    default: {
      const exhaustive: never = aggregation
      return exhaustive
    }
  }
}

export function createAggregatorSet(aggregations: PivotAggregation[]): Aggregator[] {
  return aggregations.map((item) => createAggregator(item))
}
