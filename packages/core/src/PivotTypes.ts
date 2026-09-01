export interface PivotField {
  id: string
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'unknown'
}

export type PivotFieldArea = 'filter' | 'row' | 'column' | 'value'

export type PivotAggregation = 'sum' | 'count' | 'avg' | 'min' | 'max'

export interface PivotValue {
  id: string
  field: string
  aggregation: PivotAggregation
  label?: string
}

export interface PivotFilter {
  field: string
  type: 'include' | 'exclude'
  values: unknown[]
}

export interface PivotSourceRange {
  sheetId: string
  startRow: number
  startColumn: number
  endRow: number
  endColumn: number
}

export interface PivotConfig {
  source: PivotSourceRange
  rows: PivotField[]
  columns: PivotField[]
  values: PivotValue[]
  filters: PivotFilter[]
  showRowGrandTotal: boolean
  showColumnGrandTotal: boolean
  showSubtotals: boolean
}

export interface PivotHeader {
  key: string
  label: string
  field?: string
  isTotal?: boolean
  isSubtotal?: boolean
  children?: PivotHeader[]
}

export interface PivotCell {
  value: number | null
  formatted?: string
  isTotal?: boolean
  isSubtotal?: boolean
  aggregation?: PivotAggregation
}

export interface PivotIssue {
  code: PivotErrorCode
  message: string
  userMessage: string
}

export type PivotErrorCode =
  | 'EMPTY_DATA'
  | 'NO_VALUE_FIELD'
  | 'NO_ROW_FIELD'
  | 'NO_COLUMN_FIELD'
  | 'MISSING_FIELD'
  | 'INVALID_RANGE'
  | 'SHEET_NOT_FOUND'
  | 'SOURCE_NOT_FOUND'
  | 'AGGREGATION_FAILED'
  | 'CHART_INIT_FAILED'
  | 'EMPTY_FIELDS'
  | 'UNKNOWN'

export interface PivotResult {
  rows: string[]
  columns: string[]
  headers: PivotHeader[]
  data: PivotCell[][]
  rowTotals?: PivotCell[]
  columnTotals?: PivotCell[]
  grandTotal?: PivotCell
  issues?: PivotIssue[]
}

export interface PivotStoreSnapshot {
  config: PivotConfig
  fields: PivotField[]
  records: Record<string, unknown>[]
  result: PivotResult | null
  issue: PivotIssue | null
  chartVisible: boolean
  chartType: PivotChartType
}

export type PivotChartType = 'bar' | 'line' | 'pie'

export interface PivotChartConfig {
  type: PivotChartType
  categoryField?: string
  seriesFields?: string[]
  valueField?: string
}

export const AGGREGATION_LABELS: Record<PivotAggregation, string> = {
  sum: '求和',
  count: '计数',
  avg: '平均值',
  min: '最小值',
  max: '最大值',
}

export const EMPTY_SOURCE: PivotSourceRange = {
  sheetId: '',
  startRow: 0,
  startColumn: 0,
  endRow: 0,
  endColumn: 0,
}

export function createDefaultPivotConfig(partial?: Partial<PivotConfig>): PivotConfig {
  return {
    source: partial?.source ?? { ...EMPTY_SOURCE },
    rows: partial?.rows ? [...partial.rows] : [],
    columns: partial?.columns ? [...partial.columns] : [],
    values: partial?.values ? [...partial.values] : [],
    filters: partial?.filters ? [...partial.filters] : [],
    showRowGrandTotal: partial?.showRowGrandTotal ?? true,
    showColumnGrandTotal: partial?.showColumnGrandTotal ?? true,
    showSubtotals: partial?.showSubtotals ?? true,
  }
}

export function createEmptyPivotResult(issues: PivotIssue[] = []): PivotResult {
  return {
    rows: [],
    columns: [],
    headers: [],
    data: [],
    issues,
  }
}

export function createPivotIssue(
  code: PivotErrorCode,
  message: string,
  userMessage: string,
): PivotIssue {
  return { code, message, userMessage }
}

export function reportPivotIssue(issue: PivotIssue): void {
  console.error(`[smart-pivot] ${issue.code}: ${issue.message}`)
}
