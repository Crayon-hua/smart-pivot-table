import { PivotEngine } from './PivotEngine'
import { inferFields, PivotModel } from './PivotModel'
import {
  createEmptyPivotResult,
  createPivotIssue,
  reportPivotIssue,
  type PivotAggregation,
  type PivotChartType,
  type PivotConfig,
  type PivotField,
  type PivotFieldArea,
  type PivotFilter,
  type PivotIssue,
  type PivotResult,
  type PivotSourceRange,
  type PivotStoreSnapshot,
} from './PivotTypes'

type Listener = () => void

export class PivotStore {
  private readonly model: PivotModel
  private records: Record<string, unknown>[] = []
  private result: PivotResult | null = null
  private issue: PivotIssue | null = null
  private chartVisible = false
  private chartType: PivotChartType = 'bar'
  private readonly listeners = new Set<Listener>()

  constructor(model?: PivotModel) {
    this.model = model ?? new PivotModel()
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): PivotStoreSnapshot {
    return {
      config: this.model.getConfig(),
      fields: this.model.getAvailableFields(),
      records: this.records,
      result: this.result,
      issue: this.issue,
      chartVisible: this.chartVisible,
      chartType: this.chartType,
    }
  }

  getModel(): PivotModel {
    return this.model
  }

  getResult(): PivotResult | null {
    return this.result
  }

  getIssue(): PivotIssue | null {
    return this.issue
  }

  getFilterFields(): PivotField[] {
    return this.model.getFilterFields()
  }

  setSource(source: PivotSourceRange, records: Record<string, unknown>[]): void {
    this.model.setSource(source)
    this.records = records
    this.model.setAvailableFields(inferFields(records))
    this.issue = null
    this.emit()
  }

  setRecords(records: Record<string, unknown>[]): void {
    this.records = records
    if (this.model.getAvailableFields().length === 0) {
      this.model.setAvailableFields(inferFields(records))
    }
    this.emit()
  }

  applyDefaultLayout(): void {
    this.model.applyDefaultLayout()
    this.recalculate()
  }

  addField(field: PivotField, area: PivotFieldArea, index?: number): void {
    this.model.addFieldToArea(field, area, index)
    this.recalculate()
  }

  removeField(id: string, area: PivotFieldArea): void {
    this.model.removeFieldFromArea(id, area)
    this.recalculate()
  }

  reorder(area: PivotFieldArea, fromIndex: number, toIndex: number): void {
    this.model.reorderInArea(area, fromIndex, toIndex)
    this.recalculate()
  }

  setAggregation(valueId: string, aggregation: PivotAggregation): void {
    this.model.setValueAggregation(valueId, aggregation)
    this.recalculate()
  }

  setFilter(filter: PivotFilter): void {
    this.model.setFilter(filter)
    this.recalculate()
  }

  setTotals(options: {
    showRowGrandTotal?: boolean
    showColumnGrandTotal?: boolean
    showSubtotals?: boolean
  }): void {
    this.model.setTotals(options)
    this.recalculate()
  }

  setChartVisible(visible: boolean): void {
    this.chartVisible = visible
    this.emit()
  }

  setChartType(type: PivotChartType): void {
    this.chartType = type
    this.emit()
  }

  setIssue(issue: PivotIssue | null): void {
    this.issue = issue
    if (issue) {
      reportPivotIssue(issue)
    }
    this.emit()
  }

  calculate(data?: Record<string, unknown>[]): PivotResult {
    if (data) {
      this.records = data
    }
    return this.recalculate()
  }

  recalculate(): PivotResult {
    if (this.records.length === 0) {
      const issue = createPivotIssue('EMPTY_DATA', 'No source records in store', '源数据为空，无法计算透视表')
      this.issue = issue
      this.result = createEmptyPivotResult([issue])
      reportPivotIssue(issue)
      this.emit()
      return this.result
    }

    const engine = new PivotEngine(this.records, this.model.getConfig())
    const result = engine.calculate()
    this.result = result
    const fatal = result.issues?.find(
      (item) =>
        item.code === 'EMPTY_DATA' ||
        item.code === 'NO_VALUE_FIELD' ||
        item.code === 'AGGREGATION_FAILED',
    )
    this.issue = fatal ?? null
    this.emit()
    return result
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export type { PivotConfig, PivotStoreSnapshot }
