export interface UniverRangeLike {
  getRow?: () => number
  getColumn?: () => number
  getLastRow?: () => number
  getLastColumn?: () => number
  getHeight?: () => number
  getWidth?: () => number
  getValues: () => unknown[][]
  setValues: (values: unknown[][]) => unknown
  getA1Notation?: () => string
}

export interface UniverSheetLike {
  getSheetId?: () => string
  getSheetName?: () => string
  getName?: () => string
  getRange: (
    rowOrA1: number | string,
    column?: number,
    numRows?: number,
    numColumns?: number,
  ) => UniverRangeLike
  getActiveRange?: () => UniverRangeLike | null
  getDataRange?: () => UniverRangeLike | null
  getSelection?: () => { getActiveRange?: () => UniverRangeLike | null } | null
  setName?: (name: string) => unknown
}

export interface UniverWorkbookLike {
  getActiveSheet: () => UniverSheetLike | null
  getSheetBySheetId?: (sheetId: string) => UniverSheetLike | null
  getSheetById?: (sheetId: string) => UniverSheetLike | null
  getSheetByName?: (name: string) => UniverSheetLike | null
  getSheets?: () => UniverSheetLike[]
  getActiveRange?: () => UniverRangeLike | null
  insertSheet?: () => UniverSheetLike | null
  create?: (name?: string) => UniverSheetLike | null
}

export interface UniverFacadeLike {
  getActiveWorkbook: () => UniverWorkbookLike | null
  createWorkbook?: (data?: unknown) => unknown
}

export interface UniverPivotOutputTarget {
  sheetName: string
  startRow: number
  startColumn: number
}
