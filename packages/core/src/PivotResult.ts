import { formatPivotNumber } from './utils/aggregate'
import { createMatrix } from './utils/matrix'
import type { Aggregator } from './PivotAggregator'
import {
  AGGREGATION_LABELS,
  createEmptyPivotResult,
  createPivotIssue,
  reportPivotIssue,
  type PivotAggregation,
  type PivotCell,
  type PivotHeader,
  type PivotIssue,
  type PivotResult,
  type PivotValue,
} from './PivotTypes'

export function cellFromAggregator(
  aggregator: Aggregator | undefined,
  aggregation: PivotAggregation,
  flags?: { isTotal?: boolean; isSubtotal?: boolean },
): PivotCell {
  const value = aggregator ? aggregator.result() : null
  return {
    value,
    formatted: formatPivotNumber(value),
    aggregation,
    isTotal: flags?.isTotal,
    isSubtotal: flags?.isSubtotal,
  }
}

export function emptyCell(
  aggregation?: PivotAggregation,
  flags?: { isTotal?: boolean; isSubtotal?: boolean },
): PivotCell {
  return {
    value: null,
    formatted: '',
    aggregation,
    isTotal: flags?.isTotal,
    isSubtotal: flags?.isSubtotal,
  }
}

export function makeValueLabel(value: PivotValue): string {
  const aggregationLabel = AGGREGATION_LABELS[value.aggregation]
  return value.label ?? `${value.field} · ${aggregationLabel}`
}

export function buildColumnHeaders(
  columnGroups: Array<{ key: string; labels: string[] }>,
  values: PivotValue[],
  showRowGrandTotal: boolean,
): PivotHeader[] {
  const headers: PivotHeader[] = []
  for (const group of columnGroups) {
    const label = group.labels.length > 0 ? group.labels.join(' / ') : ''
    if (values.length === 1) {
      headers.push({
        key: `${group.key}\u0001${values[0]?.id ?? 'value'}`,
        label: label || makeValueLabel(values[0]!),
        children: [],
      })
    } else {
      headers.push({
        key: group.key,
        label: label || '值',
        children: values.map((value) => ({
          key: `${group.key}\u0001${value.id}`,
          label: makeValueLabel(value),
        })),
      })
    }
  }

  if (showRowGrandTotal) {
    if (values.length === 1) {
      headers.push({
        key: '__row_total__',
        label: '总计',
        isTotal: true,
      })
    } else {
      headers.push({
        key: '__row_total__',
        label: '总计',
        isTotal: true,
        children: values.map((value) => ({
          key: `__row_total__\u0001${value.id}`,
          label: makeValueLabel(value),
          isTotal: true,
        })),
      })
    }
  }

  return headers
}

export function flattenLeafHeaders(headers: PivotHeader[]): PivotHeader[] {
  const leaves: PivotHeader[] = []
  for (const header of headers) {
    if (header.children && header.children.length > 0) {
      leaves.push(...flattenLeafHeaders(header.children))
    } else {
      leaves.push(header)
    }
  }
  return leaves
}

export function buildResultMatrix(params: {
  rowLabels: string[]
  columnLabels: string[]
  headers: PivotHeader[]
  data: PivotCell[][]
  rowTotals?: PivotCell[]
  columnTotals?: PivotCell[]
  grandTotal?: PivotCell
  issues?: PivotIssue[]
}): PivotResult {
  const { rowLabels, columnLabels, headers, data, rowTotals, columnTotals, grandTotal, issues } =
    params
  if (data.length !== rowLabels.length) {
    const issue = createPivotIssue(
      'AGGREGATION_FAILED',
      `Result row count mismatch: data=${data.length} rows=${rowLabels.length}`,
      '透视表计算结果异常',
    )
    reportPivotIssue(issue)
    return createEmptyPivotResult([issue])
  }
  return {
    rows: rowLabels,
    columns: columnLabels,
    headers,
    data,
    rowTotals,
    columnTotals,
    grandTotal,
    issues,
  }
}

export function paddedMatrix(cells: PivotCell[][], columnCount: number): PivotCell[][] {
  return cells.map((row) => {
    if (row.length === columnCount) {
      return row
    }
    const next = [...row]
    while (next.length < columnCount) {
      next.push(emptyCell())
    }
    return next
  })
}

export function createBlankMatrix(rowCount: number, columnCount: number): PivotCell[][] {
  return createMatrix(rowCount, columnCount, emptyCell())
}
