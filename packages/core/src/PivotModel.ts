import {
  createDefaultPivotConfig,
  type PivotAggregation,
  type PivotConfig,
  type PivotField,
  type PivotFieldArea,
  type PivotFilter,
  type PivotSourceRange,
  type PivotValue,
} from './PivotTypes'

let valueSeq = 0

export function createFieldId(name: string): string {
  return `field:${name}`
}

export function createValueId(field: string, aggregation: PivotAggregation): string {
  valueSeq += 1
  return `value:${field}:${aggregation}:${valueSeq}`
}

export function inferFieldType(values: unknown[]): PivotField['type'] {
  let sawNumber = false
  let sawBoolean = false
  let sawDate = false
  let sawString = false

  for (const value of values) {
    if (value === null || value === undefined || value === '') {
      continue
    }
    if (typeof value === 'boolean') {
      sawBoolean = true
      continue
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      sawNumber = true
      continue
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      sawDate = true
      continue
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed !== '' && Number.isFinite(Number(trimmed))) {
        sawNumber = true
      } else if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        sawDate = true
      } else {
        sawString = true
      }
      continue
    }
    sawString = true
  }

  if (sawString) {
    return 'string'
  }
  if (sawDate && !sawNumber && !sawBoolean) {
    return 'date'
  }
  if (sawNumber && !sawBoolean && !sawDate) {
    return 'number'
  }
  if (sawBoolean && !sawNumber && !sawDate) {
    return 'boolean'
  }
  return 'unknown'
}

export function inferFields(records: Record<string, unknown>[]): PivotField[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key)
        names.push(key)
      }
    }
  }

  return names.map((name) => {
    const column: unknown[] = []
    for (const record of records) {
      column.push(record[name])
    }
    return {
      id: createFieldId(name),
      name,
      type: inferFieldType(column),
    }
  })
}

export class PivotModel {
  private config: PivotConfig
  private availableFields: PivotField[] = []
  private filterFields: PivotField[] = []

  constructor(config?: Partial<PivotConfig>) {
    this.config = createDefaultPivotConfig(config)
  }

  getConfig(): PivotConfig {
    return {
      ...this.config,
      source: { ...this.config.source },
      rows: [...this.config.rows],
      columns: [...this.config.columns],
      values: this.config.values.map((value) => ({ ...value })),
      filters: this.config.filters.map((filter) => ({ ...filter, values: [...filter.values] })),
    }
  }

  getAvailableFields(): PivotField[] {
    return [...this.availableFields]
  }

  getFilterFields(): PivotField[] {
    return [...this.filterFields]
  }

  setAvailableFields(fields: PivotField[]): void {
    this.availableFields = fields.map((field) => ({ ...field }))
  }

  setSource(source: PivotSourceRange): void {
    this.config.source = { ...source }
  }

  setConfig(config: PivotConfig): void {
    this.config = createDefaultPivotConfig(config)
    this.filterFields = this.config.filters
      .map((filter) => this.availableFields.find((field) => field.name === filter.field))
      .filter((field): field is PivotField => Boolean(field))
      .map((field) => ({ ...field }))
  }

  setTotals(options: {
    showRowGrandTotal?: boolean
    showColumnGrandTotal?: boolean
    showSubtotals?: boolean
  }): void {
    if (options.showRowGrandTotal !== undefined) {
      this.config.showRowGrandTotal = options.showRowGrandTotal
    }
    if (options.showColumnGrandTotal !== undefined) {
      this.config.showColumnGrandTotal = options.showColumnGrandTotal
    }
    if (options.showSubtotals !== undefined) {
      this.config.showSubtotals = options.showSubtotals
    }
  }

  addFieldToArea(field: PivotField, area: PivotFieldArea, index?: number): void {
    if (area === 'value') {
      this.insertAt(this.config.values, {
        id: createValueId(field.name, 'sum'),
        field: field.name,
        aggregation: 'sum' as PivotAggregation,
      }, index)
      return
    }

    this.removeFieldFromNonValueAreas(field.id)
    const next = { ...field }
    if (area === 'row') {
      this.insertAt(this.config.rows, next, index)
      return
    }
    if (area === 'column') {
      this.insertAt(this.config.columns, next, index)
      return
    }
    this.insertAt(this.filterFields, next, index)
    if (!this.config.filters.some((item) => item.field === field.name)) {
      this.config.filters.push({ field: field.name, type: 'include', values: [] })
    }
  }

  removeFieldFromArea(id: string, area: PivotFieldArea): void {
    if (area === 'row') {
      this.config.rows = this.config.rows.filter((item) => item.id !== id)
      return
    }
    if (area === 'column') {
      this.config.columns = this.config.columns.filter((item) => item.id !== id)
      return
    }
    if (area === 'value') {
      this.config.values = this.config.values.filter((item) => item.id !== id)
      return
    }
    const field = this.filterFields.find((item) => item.id === id)
    this.filterFields = this.filterFields.filter((item) => item.id !== id)
    if (field) {
      this.config.filters = this.config.filters.filter((item) => item.field !== field.name)
    }
  }

  reorderInArea(area: PivotFieldArea, fromIndex: number, toIndex: number): void {
    const list = this.getMutableAreaList(area)
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
      return
    }
    const [moved] = list.splice(fromIndex, 1)
    if (!moved) {
      return
    }
    list.splice(toIndex, 0, moved)
  }

  setValueAggregation(valueId: string, aggregation: PivotAggregation): void {
    this.config.values = this.config.values.map((value) =>
      value.id === valueId ? { ...value, aggregation, label: undefined } : value,
    )
  }

  setFilter(filter: PivotFilter): void {
    const index = this.config.filters.findIndex((item) => item.field === filter.field)
    const next = { ...filter, values: [...filter.values] }
    if (index === -1) {
      this.config.filters.push(next)
      return
    }
    this.config.filters[index] = next
  }

  isFieldInUse(fieldId: string): boolean {
    if (this.config.rows.some((item) => item.id === fieldId)) {
      return true
    }
    if (this.config.columns.some((item) => item.id === fieldId)) {
      return true
    }
    if (this.filterFields.some((item) => item.id === fieldId)) {
      return true
    }
    const field = this.availableFields.find((item) => item.id === fieldId)
    if (!field) {
      return false
    }
    return this.config.values.some((item) => item.field === field.name)
  }

  applyDefaultLayout(): void {
    const fields = this.availableFields
    this.config.rows = []
    this.config.columns = []
    this.config.values = []
    this.config.filters = []
    this.filterFields = []
    if (fields.length === 0) {
      return
    }

    const region = fields.find((field) => field.name === '地区')
    const product = fields.find((field) => field.name === '产品')
    const sales = fields.find((field) => field.name === '销售额') ??
      fields.find((field) => field.type === 'number')
    if (region) {
      this.config.rows = [{ ...region }]
    }
    if (product) {
      this.config.columns = [{ ...product }]
    }
    if (sales) {
      this.config.values = [
        {
          id: createValueId(sales.name, 'sum'),
          field: sales.name,
          aggregation: 'sum',
        },
      ]
    }
  }

  private removeFieldFromNonValueAreas(fieldId: string): void {
    this.config.rows = this.config.rows.filter((item) => item.id !== fieldId)
    this.config.columns = this.config.columns.filter((item) => item.id !== fieldId)
    const field = this.filterFields.find((item) => item.id === fieldId)
    this.filterFields = this.filterFields.filter((item) => item.id !== fieldId)
    if (field) {
      this.config.filters = this.config.filters.filter((item) => item.field !== field.name)
    }
  }

  private insertAt<T>(list: T[], item: T, index?: number): void {
    if (index === undefined || index < 0 || index > list.length) {
      list.push(item)
      return
    }
    list.splice(index, 0, item)
  }

  private getMutableAreaList(area: PivotFieldArea): Array<PivotField | PivotValue> {
    if (area === 'row') {
      return this.config.rows
    }
    if (area === 'column') {
      return this.config.columns
    }
    if (area === 'value') {
      return this.config.values
    }
    return this.filterFields
  }
}
