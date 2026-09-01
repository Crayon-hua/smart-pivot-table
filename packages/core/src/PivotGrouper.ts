import { canonicalValue, displayValue, encodeGroupKey, getRecordValue } from './utils/groupBy'

export interface GroupBucket<T> {
  key: string
  parts: string[]
  labels: string[]
  items: T[]
}

export function groupBy<T extends Record<string, unknown>>(
  records: T[],
  fields: string[],
): Map<string, GroupBucket<T>> {
  const groups = new Map<string, GroupBucket<T>>()
  if (fields.length === 0) {
    groups.set('', {
      key: '',
      parts: [],
      labels: [],
      items: records,
    })
    return groups
  }

  for (const record of records) {
    const parts: string[] = []
    const labels: string[] = []
    for (const field of fields) {
      const value = getRecordValue(record, field)
      parts.push(canonicalValue(value))
      labels.push(displayValue(value))
    }
    const key = encodeGroupKey(parts)
    const existing = groups.get(key)
    if (existing) {
      existing.items.push(record)
    } else {
      groups.set(key, {
        key,
        parts,
        labels,
        items: [record],
      })
    }
  }

  return groups
}

export function listGroupKeys<T extends Record<string, unknown>>(
  records: T[],
  fields: string[],
): string[] {
  return [...groupBy(records, fields).keys()]
}
