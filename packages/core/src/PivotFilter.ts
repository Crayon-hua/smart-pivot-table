import { canonicalValue, getRecordValue } from './utils/groupBy'
import type { PivotFilter } from './PivotTypes'

export function applyPivotFilters(
  records: Record<string, unknown>[],
  filters: PivotFilter[],
): Record<string, unknown>[] {
  if (filters.length === 0) {
    return records
  }

  const compiled = filters.map((filter) => ({
    field: filter.field,
    type: filter.type,
    values: new Set(filter.values.map((value) => canonicalValue(value))),
  }))

  const output: Record<string, unknown>[] = []
  for (const record of records) {
    let matched = true
    for (const filter of compiled) {
      if (filter.type === 'include' && filter.values.size === 0) {
        continue
      }
      const key = canonicalValue(getRecordValue(record, filter.field))
      const has = filter.values.has(key)
      if (filter.type === 'include' ? !has : has) {
        matched = false
        break
      }
    }
    if (matched) {
      output.push(record)
    }
  }
  return output
}

export function uniqueFieldValues(
  records: Record<string, unknown>[],
  field: string,
): unknown[] {
  const seen = new Set<string>()
  const values: unknown[] = []
  for (const record of records) {
    const value = getRecordValue(record, field)
    const key = canonicalValue(value)
    if (!seen.has(key)) {
      seen.add(key)
      values.push(value)
    }
  }
  return values
}
