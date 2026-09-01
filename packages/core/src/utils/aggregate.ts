/**
 * Convert unknown input to a finite number.
 * Numeric strings are parsed. null / undefined / '' / NaN / Infinity are skipped.
 */
export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  if (typeof value === 'boolean') {
    return null
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return null
    }
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function isBlankValue(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

export function formatPivotNumber(value: number | null): string {
  if (value === null) {
    return ''
  }
  if (Number.isInteger(value)) {
    return String(value)
  }
  const rounded = Math.round(value * 10000) / 10000
  return String(rounded)
}
