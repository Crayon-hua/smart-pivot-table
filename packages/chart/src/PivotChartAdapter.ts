import type { EChartsOption } from 'echarts'
import type { PivotCell, PivotChartConfig, PivotChartType, PivotResult } from '@smartv/pivot-core'

function isPlottableRow(result: PivotResult, index: number): boolean {
  const label = result.rows[index] ?? ''
  return label !== '总计' && !label.endsWith('小计')
}

function isPlottableColumn(result: PivotResult, index: number): boolean {
  const header = result.columns[index] ?? ''
  if (header === '总计') {
    return false
  }
  for (let rowIndex = 0; rowIndex < result.rows.length; rowIndex += 1) {
    if (!isPlottableRow(result, rowIndex)) {
      continue
    }
    return result.data[rowIndex]?.[index]?.isTotal !== true
  }
  return true
}

function cellNumber(cell: PivotCell | undefined): number {
  return cell?.value ?? 0
}

export class PivotChartAdapter {
  toOption(result: PivotResult, config: PivotChartConfig): EChartsOption {
    const categories: string[] = []
    const categoryIndexes: number[] = []
    for (let i = 0; i < result.rows.length; i += 1) {
      if (isPlottableRow(result, i)) {
        categories.push(result.rows[i] ?? '')
        categoryIndexes.push(i)
      }
    }

    const seriesIndexes: number[] = []
    const seriesNames: string[] = []
    for (let i = 0; i < result.columns.length; i += 1) {
      if (isPlottableColumn(result, i)) {
        seriesIndexes.push(i)
        seriesNames.push(result.columns[i] ?? `系列${i + 1}`)
      }
    }

    if (config.seriesFields && config.seriesFields.length > 0) {
      seriesIndexes.length = 0
      seriesNames.length = 0
      for (let i = 0; i < result.columns.length; i += 1) {
        const name = result.columns[i] ?? ''
        if (config.seriesFields.includes(name) && isPlottableColumn(result, i)) {
          seriesIndexes.push(i)
          seriesNames.push(name)
        }
      }
    }

    if (categories.length === 0 || seriesIndexes.length === 0) {
      return {
        title: { text: '暂无图表数据', left: 'center', top: 'middle', textStyle: { color: '#98a2b3' } },
      }
    }

    if (config.type === 'pie') {
      return this.toPieOption(result, categories, categoryIndexes, seriesIndexes, seriesNames, config)
    }
    return this.toCartesianOption(result, categories, categoryIndexes, seriesIndexes, seriesNames, config.type)
  }

  private toCartesianOption(
    result: PivotResult,
    categories: string[],
    categoryIndexes: number[],
    seriesIndexes: number[],
    seriesNames: string[],
    type: Exclude<PivotChartType, 'pie'>,
  ): EChartsOption {
    return {
      tooltip: { trigger: 'axis' },
      legend: { type: 'scroll', bottom: 0 },
      grid: { left: 48, right: 24, top: 32, bottom: 48 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { interval: 0, rotate: categories.length > 6 ? 30 : 0 },
      },
      yAxis: { type: 'value' },
      series: seriesIndexes.map((columnIndex, seriesIndex) => ({
        name: seriesNames[seriesIndex],
        type: type === 'line' ? 'line' : 'bar',
        data: categoryIndexes.map((rowIndex) => cellNumber(result.data[rowIndex]?.[columnIndex])),
        smooth: type === 'line',
      })),
    }
  }

  private toPieOption(
    result: PivotResult,
    categories: string[],
    categoryIndexes: number[],
    seriesIndexes: number[],
    seriesNames: string[],
    config: PivotChartConfig,
  ): EChartsOption {
    const valueIndex = this.resolvePieColumn(seriesIndexes, seriesNames, config)
    return {
      tooltip: { trigger: 'item' },
      legend: { type: 'scroll', bottom: 0 },
      series: [
        {
          name: seriesNames[seriesIndexes.indexOf(valueIndex)] ?? '值',
          type: 'pie',
          radius: ['35%', '65%'],
          data: categoryIndexes.map((rowIndex, index) => ({
            name: categories[index],
            value: cellNumber(result.data[rowIndex]?.[valueIndex]),
          })),
        },
      ],
    }
  }

  private resolvePieColumn(
    seriesIndexes: number[],
    seriesNames: string[],
    config: PivotChartConfig,
  ): number {
    if (config.valueField) {
      const matched = seriesNames.findIndex((name) => name === config.valueField)
      if (matched >= 0) {
        return seriesIndexes[matched] ?? seriesIndexes[0] ?? 0
      }
    }
    return seriesIndexes[0] ?? 0
  }
}
