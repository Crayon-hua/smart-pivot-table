import { createPivotIssue, reportPivotIssue, type PivotIssue, type PivotSourceRange } from '@smart/pivot-core'
import type { UniverFacadeLike, UniverRangeLike, UniverSheetLike, UniverWorkbookLike } from './UniverTypes'

export function getWorkbook(api: UniverFacadeLike): UniverWorkbookLike | null {
  try {
    return api.getActiveWorkbook()
  } catch (error) {
    reportRangeIssue('SOURCE_NOT_FOUND', error, '无法读取当前工作簿')
    return null
  }
}

export function getSheetById(workbook: UniverWorkbookLike, sheetId: string): UniverSheetLike | null {
  try {
    if (sheetId && workbook.getSheetBySheetId) {
      const sheet = workbook.getSheetBySheetId(sheetId)
      if (sheet) {
        return sheet
      }
    }
    if (sheetId && workbook.getSheetById) {
      const sheet = workbook.getSheetById(sheetId)
      if (sheet) {
        return sheet
      }
    }
    return workbook.getActiveSheet()
  } catch (error) {
    reportRangeIssue('SHEET_NOT_FOUND', error, '找不到指定工作表')
    return null
  }
}

export function getSheetName(sheet: UniverSheetLike): string {
  return sheet.getSheetName?.() ?? sheet.getName?.() ?? ''
}

export function getSheetId(sheet: UniverSheetLike): string {
  return sheet.getSheetId?.() ?? getSheetName(sheet)
}

export function rangeToSource(sheet: UniverSheetLike, range: UniverRangeLike): PivotSourceRange | null {
  const startRow = range.getRow?.()
  const startColumn = range.getColumn?.()
  if (startRow === undefined || startColumn === undefined) {
    return null
  }
  const height = range.getHeight?.() ?? 1
  const width = range.getWidth?.() ?? 1
  const lastRow = range.getLastRow?.() ?? startRow + height - 1
  const lastColumn = range.getLastColumn?.() ?? startColumn + width - 1
  return {
    sheetId: getSheetId(sheet),
    startRow,
    startColumn,
    endRow: lastRow,
    endColumn: lastColumn,
  }
}

export function readActiveSource(api: UniverFacadeLike): PivotSourceRange | null {
  const workbook = getWorkbook(api)
  if (!workbook) {
    return null
  }
  const sheet = workbook.getActiveSheet()
  if (!sheet) {
    const issue = createPivotIssue('SHEET_NOT_FOUND', 'No active sheet', '当前没有打开的工作表')
    reportPivotIssue(issue)
    return null
  }

  const range =
    sheet.getActiveRange?.() ??
    sheet.getSelection?.()?.getActiveRange?.() ??
    workbook.getActiveRange?.() ??
    sheet.getDataRange?.() ??
    null

  if (!range) {
    const fallback = sheet.getDataRange?.() ?? sheet.getRange(0, 0)
    return rangeToSource(sheet, fallback)
  }

  const source = rangeToSource(sheet, range)
  if (!source) {
    return null
  }

  const isSingleCell = source.startRow === source.endRow && source.startColumn === source.endColumn
  if (isSingleCell) {
    const dataRange = sheet.getDataRange?.()
    if (dataRange) {
      return rangeToSource(sheet, dataRange) ?? source
    }
  }
  return source
}

export function readRangeValues(
  api: UniverFacadeLike,
  source: PivotSourceRange,
): unknown[][] | null {
  if (!isValidSource(source)) {
    const issue = createPivotIssue(
      'INVALID_RANGE',
      `Invalid range ${JSON.stringify(source)}`,
      '选择的数据区域不合法',
    )
    reportPivotIssue(issue)
    return null
  }

  const workbook = getWorkbook(api)
  if (!workbook) {
    return null
  }
  const sheet = getSheetById(workbook, source.sheetId)
  if (!sheet) {
    const issue = createPivotIssue('SHEET_NOT_FOUND', `Sheet not found: ${source.sheetId}`, '找不到数据所在工作表')
    reportPivotIssue(issue)
    return null
  }

  const numRows = source.endRow - source.startRow + 1
  const numColumns = source.endColumn - source.startColumn + 1
  try {
    const range = sheet.getRange(source.startRow, source.startColumn, numRows, numColumns)
    return range.getValues()
  } catch (error) {
    reportRangeIssue('INVALID_RANGE', error, '读取单元格区域失败')
    return null
  }
}

export function isValidSource(source: PivotSourceRange): boolean {
  return (
    source.startRow >= 0 &&
    source.startColumn >= 0 &&
    source.endRow >= source.startRow &&
    source.endColumn >= source.startColumn
  )
}

function reportRangeIssue(code: PivotIssue['code'], error: unknown, userMessage: string): void {
  const message = error instanceof Error ? error.message : String(error)
  reportPivotIssue(createPivotIssue(code, message, userMessage))
}
