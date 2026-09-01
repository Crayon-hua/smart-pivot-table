import type { PivotFieldArea } from '@smart/pivot-core'

export const PIVOT_DRAG_MIME = 'application/x-smart-pivot'

export interface PivotDragPayload {
  from: 'list' | PivotFieldArea
  fieldId?: string
  itemId?: string
  index?: number
}

export function writeDragPayload(event: DragEvent, payload: PivotDragPayload): void {
  event.dataTransfer?.setData(PIVOT_DRAG_MIME, JSON.stringify(payload))
  event.dataTransfer?.setData('text/plain', JSON.stringify(payload))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

export function readDragPayload(event: DragEvent): PivotDragPayload | null {
  const raw =
    event.dataTransfer?.getData(PIVOT_DRAG_MIME) ||
    event.dataTransfer?.getData('text/plain') ||
    ''
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as PivotDragPayload
  } catch {
    return null
  }
}
