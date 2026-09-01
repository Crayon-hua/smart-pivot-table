const NULL_KEY = '__null__'
const UNDEFINED_KEY = '__undefined__'
const EMPTY_KEY = '__empty__'

export function canonicalValue(value: unknown): string {
  if (value === null) {
    return NULL_KEY
  }
  if (value === undefined) {
    return UNDEFINED_KEY
  }
  if (typeof value === 'string' && value.trim() === '') {
    return EMPTY_KEY
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }
  if (typeof value === 'number' && Number.isNaN(value)) {
    return '__NaN__'
  }
  return String(value)
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(空白)'
  }
  if (typeof value === 'string' && value.trim() === '') {
    return '(空白)'
  }
  if (typeof value === 'number' && Number.isNaN(value)) {
    return '(非数字)'
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function encodeGroupKey(parts: string[]): string {
  return parts.join('\u0001')
}

export function decodeGroupKey(key: string): string[] {
  if (key === '') {
    return []
  }
  return key.split('\u0001')
}

export function getRecordValue(record: Record<string, unknown>, field: string): unknown {
  if (!Object.prototype.hasOwnProperty.call(record, field)) {
    return undefined
  }
  return record[field]
}
