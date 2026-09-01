import { createPivotIssue, reportPivotIssue, type PivotSourceRange } from '@smart/pivot-core'
import { isValidSource, readRangeValues } from './UniverRangeReader'
import type { UniverFacadeLike } from './UniverTypes'

function unwrapCell(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }
  if (typeof value === 'object' && value !== null && 'v' in value) {
    return (value as { v: unknown }).v
  }
  return value
}

function toFieldName(value: unknown, columnIndex: number): string {
  const unwrapped = unwrapCell(value)
  if (unwrapped === null || unwrapped === undefined || String(unwrapped).trim() === '') {
    return `列${columnIndex + 1}`
  }
  return String(unwrapped)
}

export class UniverDataAdapter {
  constructor(private readonly api: UniverFacadeLike) {}

  readRange(source: PivotSourceRange): Record<string, unknown>[] {
    if (!isValidSource(source)) {
      reportPivotIssue(createPivotIssue('INVALID_RANGE', 'Range is invalid', '数据区域不合法'))
      return []
    }

    const matrix = readRangeValues(this.api, source)
    if (!matrix) {
      reportPivotIssue(createPivotIssue('SOURCE_NOT_FOUND', 'Failed to read range', '无法读取源数据区域'))
      return []
    }
    return this.matrixToRecords(matrix)
  }

  matrixToRecords(matrix: unknown[][]): Record<string, unknown>[] {
    if (matrix.length === 0) {
      reportPivotIssue(createPivotIssue('EMPTY_DATA', 'Range matrix is empty', '源数据为空'))
      return []
    }

    const headerRow = matrix[0] ?? []
    if (headerRow.length === 0) {
      reportPivotIssue(createPivotIssue('EMPTY_FIELDS', 'Header row is empty', '字段行为空'))
      return []
    }

    const headers = headerRow.map((cell, index) => toFieldName(cell, index))
    const records: Record<string, unknown>[] = []

    for (let i = 1; i < matrix.length; i += 1) {
      const row = matrix[i] ?? []
      const record: Record<string, unknown> = {}
      let hasValue = false
      for (let j = 0; j < headers.length; j += 1) {
        const value = unwrapCell(row[j])
        record[headers[j]!] = value ?? null
        if (value !== null && value !== undefined && value !== '') {
          hasValue = true
        }
      }
      if (hasValue) {
        records.push(record)
      }
    }

    return records
  }
}
