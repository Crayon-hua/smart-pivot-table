import {
  createPivotIssue,
  flattenLeafHeaders,
  formatPivotNumber,
  reportPivotIssue,
  type PivotResult,
} from '@smart/pivot-core'
import { getSheetName, getWorkbook } from './UniverRangeReader'
import type { UniverFacadeLike, UniverPivotOutputTarget, UniverSheetLike } from './UniverTypes'

const DEFAULT_OUTPUT: UniverPivotOutputTarget = {
  sheetName: '透视表',
  startRow: 0,
  startColumn: 0,
}

export class UniverPivotRenderer {
  constructor(private readonly api: UniverFacadeLike) {}

  render(result: PivotResult, target: UniverPivotOutputTarget = DEFAULT_OUTPUT): boolean {
    try {
      const sheet = this.ensureSheet(target.sheetName)
      if (!sheet) {
        reportPivotIssue(createPivotIssue('SHEET_NOT_FOUND', 'Cannot create output sheet', '无法创建透视表工作表'))
        return false
      }

      const matrix = this.resultToMatrix(result)
      const range = sheet.getRange(target.startRow, target.startColumn, matrix.length, matrix[0]?.length ?? 1)
      range.setValues(matrix)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      reportPivotIssue(createPivotIssue('AGGREGATION_FAILED', message, '写入透视表失败'))
      return false
    }
  }

  resultToMatrix(result: PivotResult): string[][] {
    const leafHeaders = flattenLeafHeaders(result.headers)
    const columnCount = Math.max(leafHeaders.length, result.columns.length, 1)
    const headerLabels = leafHeaders.length > 0
      ? leafHeaders.map((header) => header.label)
      : result.columns

    const matrix: string[][] = []
    matrix.push(['', ...headerLabels])

    for (let i = 0; i < result.rows.length; i += 1) {
      const rowLabel = result.rows[i] ?? ''
      const cells = result.data[i] ?? []
      const values = headerLabels.map((_, index) => formatPivotNumber(cells[index]?.value ?? null))
      while (values.length < columnCount) {
        values.push('')
      }
      matrix.push([rowLabel, ...values])
    }

    if (matrix.length === 1) {
      matrix.push(['(无数据)', ...headerLabels.map(() => '')])
    }

    return matrix
  }

  private ensureSheet(name: string): UniverSheetLike | null {
    const workbook = getWorkbook(this.api)
    if (!workbook) {
      return null
    }

    const existing = workbook.getSheetByName?.(name)
    if (existing) {
      return existing
    }

    const created = workbook.create?.(name) ?? workbook.insertSheet?.() ?? null
    if (created && getSheetName(created) !== name) {
      created.setName?.(name)
    }
    return created ?? workbook.getActiveSheet()
  }
}
