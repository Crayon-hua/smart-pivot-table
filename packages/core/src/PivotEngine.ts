import { canonicalValue, displayValue, encodeGroupKey, getRecordValue } from './utils/groupBy'
import type { Aggregator } from './PivotAggregator'
import { createAggregator } from './PivotAggregator'
import { applyPivotFilters } from './PivotFilter'
import { buildColumnHeaders, cellFromAggregator, flattenLeafHeaders } from './PivotResult'
import { comparePivotLabels, sortLabelLists } from './PivotSorter'
import {
  createEmptyPivotResult,
  createPivotIssue,
  reportPivotIssue,
  type PivotCell,
  type PivotConfig,
  type PivotIssue,
  type PivotResult,
  type PivotValue,
} from './PivotTypes'

const ROOT_KEY = ''

interface RowNode {
  key: string
  labels: string[]
  isSubtotal: boolean
}

export class PivotEngine {
  constructor(
    private readonly data: Record<string, unknown>[],
    private readonly config: PivotConfig,
  ) {}

  calculate(): PivotResult {
    try {
      return this.calculateUnsafe()
    } catch (error) {
      const issue = createPivotIssue(
        'AGGREGATION_FAILED',
        error instanceof Error ? error.message : String(error),
        '透视表计算失败，请检查数据与字段配置',
      )
      reportPivotIssue(issue)
      return createEmptyPivotResult([issue])
    }
  }

  private calculateUnsafe(): PivotResult {
    const issues: PivotIssue[] = []
    const { rows, columns, values, filters } = this.config

    if (!this.data.length) {
      const issue = createPivotIssue('EMPTY_DATA', 'Source records are empty', '源数据为空')
      reportPivotIssue(issue)
      return createEmptyPivotResult([issue])
    }

    if (values.length === 0) {
      const issue = createPivotIssue(
        'NO_VALUE_FIELD',
        'No value field configured',
        '请将至少一个字段拖入“值”区域',
      )
      reportPivotIssue(issue)
      issues.push(issue)
      return createEmptyPivotResult(issues)
    }

    if (rows.length === 0) {
      issues.push(
        createPivotIssue('NO_ROW_FIELD', 'No row field configured', '当前没有行字段，将按整体汇总'),
      )
    }
    if (columns.length === 0) {
      issues.push(
        createPivotIssue(
          'NO_COLUMN_FIELD',
          'No column field configured',
          '当前没有列字段，将按行汇总',
        ),
      )
    }

    const missing = this.findMissingFields()
    if (missing.length > 0) {
      const issue = createPivotIssue(
        'MISSING_FIELD',
        `Missing fields: ${missing.join(', ')}`,
        `字段不存在：${missing.join('、')}`,
      )
      reportPivotIssue(issue)
      issues.push(issue)
    }

    const filtered = applyPivotFilters(this.data, filters)
    if (filtered.length === 0) {
      const issue = createPivotIssue(
        'EMPTY_DATA',
        'No rows remain after filtering',
        '筛选后没有可计算的数据',
      )
      reportPivotIssue(issue)
      return createEmptyPivotResult([...issues, issue])
    }

    const rowFieldNames = rows.map((field) => field.name)
    const columnFieldNames = columns.map((field) => field.name)

    const leafMap = new Map<string, Map<string, Aggregator[]>>()
    const rowTotalMap = new Map<string, Aggregator[]>()
    const colTotalMap = new Map<string, Aggregator[]>()
    const subtotalMap = new Map<string, Map<string, Aggregator[]>>()
    const subtotalRowTotalMap = new Map<string, Aggregator[]>()
    const grandAggregators = this.createValueAggregators()
    const rowMeta = new Map<string, string[]>()
    const colMeta = new Map<string, string[]>()
    const prefixKeyByDisplay = new Map<string, string>()

    for (const record of filtered) {
      const rowParts = rowFieldNames.map((name) => getRecordValue(record, name))
      const colParts = columnFieldNames.map((name) => getRecordValue(record, name))
      const rowLabels = rowParts.map((part) => displayValue(part))
      const colLabels = colParts.map((part) => displayValue(part))
      const rowKey = encodeGroupKey(rowParts.map((part) => canonicalValue(part)))
      const colKey = encodeGroupKey(colParts.map((part) => canonicalValue(part)))

      rowMeta.set(rowKey, rowLabels)
      colMeta.set(colKey, colLabels)

      this.addRecord(leafMap, rowKey, colKey, record, values)
      this.addToAggregators(this.getOrCreateAggregators(rowTotalMap, rowKey), record, values)
      this.addToAggregators(this.getOrCreateAggregators(colTotalMap, colKey), record, values)
      this.addToAggregators(grandAggregators, record, values)

      if (this.config.showSubtotals && rowFieldNames.length > 1) {
        for (let depth = 1; depth < rowFieldNames.length; depth += 1) {
          const prefixParts = rowParts.slice(0, depth)
          const prefixKey = encodeGroupKey(prefixParts.map((part) => canonicalValue(part)))
          const displayPrefix = prefixParts.map((part) => displayValue(part)).join('\u0001')
          prefixKeyByDisplay.set(displayPrefix, prefixKey)
          this.addRecord(subtotalMap, prefixKey, colKey, record, values)
          this.addToAggregators(
            this.getOrCreateAggregators(subtotalRowTotalMap, prefixKey),
            record,
            values,
          )
        }
      }
    }

    const rowNodes = this.buildRowNodes(rowMeta, rowFieldNames.length, prefixKeyByDisplay)
    const columnGroups = this.buildColumnGroups(colMeta)

    const headers = buildColumnHeaders(columnGroups, values, this.config.showRowGrandTotal)
    const leafHeaders = flattenLeafHeaders(headers)
    const columnLabels = leafHeaders.map((header) => header.label)

    const data: PivotCell[][] = []
    const rowLabels: string[] = []
    const extractedRowTotals: PivotCell[] = []

    for (const node of rowNodes) {
      rowLabels.push(this.formatRowLabel(node, rowFieldNames.length))
      const row: PivotCell[] = []
      const aggregatorSource = node.isSubtotal ? subtotalMap : leafMap
      const totalSource = node.isSubtotal ? subtotalRowTotalMap : rowTotalMap

      for (const group of columnGroups) {
        const aggregators = aggregatorSource.get(node.key)?.get(group.key)
        for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
          const value = values[valueIndex]!
          row.push(
            cellFromAggregator(aggregators?.[valueIndex], value.aggregation, {
              isSubtotal: node.isSubtotal,
            }),
          )
        }
      }

      if (this.config.showRowGrandTotal) {
        const totals = totalSource.get(node.key)
        for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
          const value = values[valueIndex]!
          row.push(
            cellFromAggregator(totals?.[valueIndex], value.aggregation, {
              isTotal: true,
              isSubtotal: node.isSubtotal,
            }),
          )
        }
      }

      data.push(row)
      extractedRowTotals.push(this.firstTotalCell(totalSource.get(node.key), values, node.isSubtotal))
    }

    let columnTotals: PivotCell[] | undefined
    let grandTotal: PivotCell | undefined

    if (this.config.showColumnGrandTotal && rowFieldNames.length > 0) {
      const totalRow: PivotCell[] = []
      const extractedColumnTotals: PivotCell[] = []
      for (const group of columnGroups) {
        const aggregators = colTotalMap.get(group.key)
        for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
          const value = values[valueIndex]!
          const cell = cellFromAggregator(aggregators?.[valueIndex], value.aggregation, {
            isTotal: true,
          })
          totalRow.push(cell)
          if (valueIndex === 0) {
            extractedColumnTotals.push(cell)
          }
        }
      }
      if (this.config.showRowGrandTotal) {
        for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
          const value = values[valueIndex]!
          totalRow.push(
            cellFromAggregator(grandAggregators[valueIndex], value.aggregation, { isTotal: true }),
          )
        }
      }
      rowLabels.push('总计')
      data.push(totalRow)
      extractedRowTotals.push(
        cellFromAggregator(grandAggregators[0], values[0]?.aggregation ?? 'sum', { isTotal: true }),
      )
      columnTotals = extractedColumnTotals
    }

    grandTotal = cellFromAggregator(grandAggregators[0], values[0]?.aggregation ?? 'sum', {
      isTotal: true,
    })

    const uniqueIssues = issues.filter(
      (issue, index, list) => list.findIndex((item) => item.code === issue.code) === index,
    )

    return {
      rows: rowLabels,
      columns: columnLabels,
      headers,
      data,
      rowTotals: extractedRowTotals,
      columnTotals,
      grandTotal,
      issues: uniqueIssues.length > 0 ? uniqueIssues : undefined,
    }
  }

  private findMissingFields(): string[] {
    const names = new Set<string>()
    for (const field of [...this.config.rows, ...this.config.columns]) {
      names.add(field.name)
    }
    for (const value of this.config.values) {
      names.add(value.field)
    }
    for (const filter of this.config.filters) {
      names.add(filter.field)
    }
    const missing: string[] = []
    const sample = this.data[0]
    if (!sample) {
      return [...names]
    }
    for (const name of names) {
      if (!Object.prototype.hasOwnProperty.call(sample, name)) {
        const existsInSomeRow = this.data.some((record) =>
          Object.prototype.hasOwnProperty.call(record, name),
        )
        if (!existsInSomeRow) {
          missing.push(name)
        }
      }
    }
    return missing
  }

  private createValueAggregators(): Aggregator[] {
    return this.config.values.map((value) => createAggregator(value.aggregation))
  }

  private getOrCreateAggregators(store: Map<string, Aggregator[]>, key: string): Aggregator[] {
    const existing = store.get(key)
    if (existing) {
      return existing
    }
    const created = this.createValueAggregators()
    store.set(key, created)
    return created
  }

  private addToAggregators(
    aggregators: Aggregator[],
    record: Record<string, unknown>,
    values: PivotValue[],
  ): void {
    for (let i = 0; i < values.length; i += 1) {
      aggregators[i]?.add(getRecordValue(record, values[i]!.field))
    }
  }

  private addRecord(
    store: Map<string, Map<string, Aggregator[]>>,
    rowKey: string,
    colKey: string,
    record: Record<string, unknown>,
    values: PivotValue[],
  ): void {
    let rowMap = store.get(rowKey)
    if (!rowMap) {
      rowMap = new Map()
      store.set(rowKey, rowMap)
    }
    let aggregators = rowMap.get(colKey)
    if (!aggregators) {
      aggregators = this.createValueAggregators()
      rowMap.set(colKey, aggregators)
    }
    this.addToAggregators(aggregators, record, values)
  }

  private buildColumnGroups(colMeta: Map<string, string[]>): Array<{ key: string; labels: string[] }> {
    if (this.config.columns.length === 0) {
      return [{ key: ROOT_KEY, labels: [] }]
    }
    const lists = [...colMeta.entries()].map(([key, labels]) => ({ key, labels }))
    const sorted = sortLabelLists(lists.map((item) => item.labels))
    const byLabel = new Map(lists.map((item) => [item.labels.join('\u0001'), item]))
    return sorted.map((labels) => byLabel.get(labels.join('\u0001')) ?? { key: encodeGroupKey(labels), labels })
  }

  private buildRowNodes(
    rowMeta: Map<string, string[]>,
    rowDepth: number,
    prefixKeyByDisplay: Map<string, string>,
  ): RowNode[] {
    if (rowDepth === 0) {
      return [{ key: ROOT_KEY, labels: ['总计'], isSubtotal: false }]
    }

    const lists = [...rowMeta.entries()].map(([key, labels]) => ({ key, labels }))
    const sortedLabels = sortLabelLists(lists.map((item) => item.labels))
    const keyByLabel = new Map(lists.map((item) => [item.labels.join('\u0001'), item.key]))

    if (!this.config.showSubtotals || rowDepth < 2) {
      return sortedLabels.map((labels) => ({
        key:
          keyByLabel.get(labels.join('\u0001')) ??
          encodeGroupKey(labels.map((label) => canonicalValue(label))),
        labels,
        isSubtotal: false,
      }))
    }

    const nodes: RowNode[] = []
    this.emitRowTree(sortedLabels, 0, [], keyByLabel, prefixKeyByDisplay, nodes)
    return nodes
  }

  private emitRowTree(
    sortedLabels: string[][],
    depth: number,
    prefix: string[],
    keyByLabel: Map<string, string>,
    prefixKeyByDisplay: Map<string, string>,
    output: RowNode[],
  ): void {
    const groups = new Map<string, string[][]>()
    for (const labels of sortedLabels) {
      if (!startsWith(labels, prefix)) {
        continue
      }
      const part = labels[depth]
      if (part === undefined) {
        continue
      }
      const bucket = groups.get(part)
      if (bucket) {
        bucket.push(labels)
      } else {
        groups.set(part, [labels])
      }
    }

    const sortedKeys = [...groups.keys()].sort(comparePivotLabels)
    const lastDepth = this.config.rows.length - 1

    for (const part of sortedKeys) {
      const children = groups.get(part) ?? []
      const nextPrefix = [...prefix, part]
      if (depth === lastDepth) {
        output.push({
          key:
            keyByLabel.get(nextPrefix.join('\u0001')) ??
            encodeGroupKey(nextPrefix.map((label) => canonicalValue(label))),
          labels: nextPrefix,
          isSubtotal: false,
        })
      } else {
        this.emitRowTree(children, depth + 1, nextPrefix, keyByLabel, prefixKeyByDisplay, output)
        output.push({
          key:
            prefixKeyByDisplay.get(nextPrefix.join('\u0001')) ??
            encodeGroupKey(nextPrefix.map((label) => canonicalValue(label))),
          labels: [...nextPrefix, '小计'],
          isSubtotal: true,
        })
      }
    }
  }

  private formatRowLabel(node: RowNode, rowDepth: number): string {
    if (rowDepth === 0) {
      return '(全部)'
    }
    if (node.isSubtotal) {
      const parent = node.labels.slice(0, -1).join(' / ')
      return parent ? `${parent} 小计` : '小计'
    }
    return node.labels.join(' / ')
  }

  private firstTotalCell(
    aggregators: Aggregator[] | undefined,
    values: PivotValue[],
    isSubtotal: boolean,
  ): PivotCell {
    const aggregation = values[0]?.aggregation ?? 'sum'
    return cellFromAggregator(aggregators?.[0], aggregation, {
      isTotal: true,
      isSubtotal,
    })
  }
}

function startsWith(labels: string[], prefix: string[]): boolean {
  if (prefix.length > labels.length) {
    return false
  }
  for (let i = 0; i < prefix.length; i += 1) {
    if (labels[i] !== prefix[i]) {
      return false
    }
  }
  return true
}
