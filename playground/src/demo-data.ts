import { LocaleType } from '@univerjs/core'

export interface DemoRow {
  日期: string
  地区: string
  产品: string
  销售额: number
  数量: number
}

const REGIONS = ['华东', '华南', '华北', '西南', '东北']
const PRODUCTS = ['A', 'B', 'C', 'D']

function seeded(index: number): number {
  const x = Math.sin(index * 999) * 10000
  return x - Math.floor(x)
}

export function createDemoRows(count = 1000): DemoRow[] {
  const rows: DemoRow[] = []
  for (let i = 0; i < count; i += 1) {
    const day = (i % 365) + 1
    const date = new Date(Date.UTC(2025, 0, day))
    const iso = date.toISOString().slice(0, 10)
    rows.push({
      日期: iso,
      地区: REGIONS[i % REGIONS.length]!,
      产品: PRODUCTS[Math.floor(seeded(i) * PRODUCTS.length)]!,
      销售额: Math.round(80 + seeded(i + 3) * 920),
      数量: Math.round(1 + seeded(i + 7) * 19),
    })
  }
  return rows
}

export function createDemoWorkbookData(rows: DemoRow[] = createDemoRows()) {
  const headers = ['日期', '地区', '产品', '销售额', '数量'] as const
  const cellData: Record<number, Record<number, { v: string | number }>> = {
    0: {
      0: { v: headers[0] },
      1: { v: headers[1] },
      2: { v: headers[2] },
      3: { v: headers[3] },
      4: { v: headers[4] },
    },
  }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!
    cellData[i + 1] = {
      0: { v: row.日期 },
      1: { v: row.地区 },
      2: { v: row.产品 },
      3: { v: row.销售额 },
      4: { v: row.数量 },
    }
  }

  return {
    id: 'smart-pivot-demo',
    name: 'Univer Pivot Demo',
    appVersion: '0.0.0',
    locale: LocaleType.ZH_CN,
    sheetOrder: ['source'],
    sheets: {
      source: {
        id: 'source',
        name: '源数据',
        cellData,
        rowCount: rows.length + 20,
        columnCount: 8,
        defaultColumnWidth: 96,
      },
    },
  }
}
