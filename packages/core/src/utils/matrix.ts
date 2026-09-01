export function createMatrix<T>(rowCount: number, columnCount: number, fill: T): T[][] {
  const matrix: T[][] = []
  for (let i = 0; i < rowCount; i += 1) {
    const row: T[] = []
    for (let j = 0; j < columnCount; j += 1) {
      row.push(fill)
    }
    matrix.push(row)
  }
  return matrix
}

export function flattenHeaders(headers: { label: string; children?: unknown[] }[]): string[] {
  const labels: string[] = []
  for (const header of headers) {
    if (!header.children || header.children.length === 0) {
      labels.push(header.label)
    }
  }
  return labels
}
