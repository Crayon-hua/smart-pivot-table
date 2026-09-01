import {
  CommandType,
  ICommandService,
  Injector,
  Plugin,
  UniverInstanceType,
  type ICommand,
} from '@univerjs/core'
import { PivotStore } from '@smartv/pivot-core'
import { createPivotIssue } from '@smartv/pivot-core'
import { UniverDataAdapter } from './UniverDataAdapter'
import { UniverPivotRenderer } from './UniverPivotRenderer'
import { readActiveSource } from './UniverRangeReader'
import type { UniverFacadeLike } from './UniverTypes'

export const SMART_PIVOT_PLUGIN_NAME = 'SMART_PIVOT_PLUGIN'

export const CREATE_PIVOT_TABLE_COMMAND_ID = 'smart-pivot.command.create-table'
export const CREATE_PIVOT_CHART_COMMAND_ID = 'smart-pivot.command.create-chart'
export const REFRESH_PIVOT_COMMAND_ID = 'smart-pivot.command.refresh'

export interface PivotUniverSession {
  store: PivotStore
  adapter: UniverDataAdapter
  renderer: UniverPivotRenderer
  createFromSelection: (applyDefault?: boolean) => boolean
  refresh: () => boolean
  showChart: () => boolean
}

export function createPivotUniverSession(
  api: UniverFacadeLike,
  store: PivotStore = new PivotStore(),
): PivotUniverSession {
  const adapter = new UniverDataAdapter(api)
  const renderer = new UniverPivotRenderer(api)

  const refresh = (): boolean => {
    const snapshot = store.getSnapshot()
    if (!snapshot.config.source.sheetId && snapshot.records.length === 0) {
      store.setIssue(createPivotIssue('SOURCE_NOT_FOUND', 'No pivot source', '请先选择数据区域并创建透视表'))
      return false
    }
    const records =
      snapshot.records.length > 0 ? snapshot.records : adapter.readRange(snapshot.config.source)
    if (records.length === 0) {
      store.setIssue(createPivotIssue('EMPTY_DATA', 'No records to refresh', '没有可刷新的数据'))
      return false
    }
    if (snapshot.records.length === 0) {
      store.setRecords(records)
    }
    const result = store.calculate(records)
    return renderer.render(result)
  }

  const createFromSelection = (applyDefault = true): boolean => {
    const source = readActiveSource(api)
    if (!source) {
      store.setIssue(createPivotIssue('INVALID_RANGE', 'No active range', '请先选择数据区域'))
      return false
    }
    const records = adapter.readRange(source)
    if (records.length === 0) {
      store.setIssue(createPivotIssue('EMPTY_DATA', 'Selected range has no records', '选区没有可透视的数据'))
      return false
    }
    store.setSource(source, records)
    if (applyDefault) {
      store.applyDefaultLayout()
    } else {
      store.recalculate()
    }
    const result = store.getResult()
    if (!result) {
      return false
    }
    return renderer.render(result)
  }

  const showChart = (): boolean => {
    if (!store.getResult() || store.getResult()?.rows.length === 0) {
      const created = createFromSelection(true)
      if (!created) {
        return false
      }
    }
    store.setChartVisible(true)
    return true
  }

  return { store, adapter, renderer, createFromSelection, refresh, showChart }
}

export class UniverPivotPlugin extends Plugin {
  static override pluginName = SMART_PIVOT_PLUGIN_NAME
  static override type = UniverInstanceType.UNIVER_SHEET

  private store = new PivotStore()
  private session: PivotUniverSession | null = null
  protected _injector: Injector

  constructor(_injector: Injector) {
    super()
    this._injector = _injector
  }

  bindFacade(api: UniverFacadeLike): PivotUniverSession {
    this.session = createPivotUniverSession(api, this.store)
    return this.session
  }

  getStore(): PivotStore {
    return this.store
  }

  getSession(): PivotUniverSession | null {
    return this.session
  }

  override onStarting(): void {
    const commandService = this._injector.get(ICommandService)
    commandService.registerCommand(this.createCommand(CREATE_PIVOT_TABLE_COMMAND_ID, () => {
      return this.session?.createFromSelection(true) ?? false
    }))
    commandService.registerCommand(this.createCommand(CREATE_PIVOT_CHART_COMMAND_ID, () => {
      return this.session?.showChart() ?? false
    }))
    commandService.registerCommand(this.createCommand(REFRESH_PIVOT_COMMAND_ID, () => {
      return this.session?.refresh() ?? false
    }))
  }

  private createCommand(id: string, handler: () => boolean): ICommand {
    return {
      id,
      type: CommandType.COMMAND,
      handler: () => handler(),
    }
  }
}
