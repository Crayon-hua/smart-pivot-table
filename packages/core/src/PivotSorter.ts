function isNumericLabel(label: string): boolean {
  if (label === '(空白)' || label === '(非数字)') {
    return false
  }
  const parsed = Number(label)
  return Number.isFinite(parsed)
}

export function comparePivotLabels(left: string, right: string): number {
  const leftNumeric = isNumericLabel(left)
  const rightNumeric = isNumericLabel(right)
  if (leftNumeric && rightNumeric) {
    return Number(left) - Number(right)
  }
  return left.localeCompare(right, 'zh-CN', { numeric: true, sensitivity: 'base' })
}

export function sortRows(labels: string[]): string[] {
  return [...labels].sort(comparePivotLabels)
}

export function sortColumns(labels: string[]): string[] {
  return [...labels].sort(comparePivotLabels)
}

export function sortLabelLists(lists: string[][]): string[][] {
  return [...lists].sort((left, right) => {
    const length = Math.max(left.length, right.length)
    for (let i = 0; i < length; i += 1) {
      const compared = comparePivotLabels(left[i] ?? '', right[i] ?? '')
      if (compared !== 0) {
        return compared
      }
    }
    return left.length - right.length
  })
}
