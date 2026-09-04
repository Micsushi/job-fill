export type NewAnswer = {
  page?: string
  section: string
  fieldType: string
  fieldName: string
  answer: any
  /**
   * Some controls (searchable dropdowns, the phone country picker) only
   * commit a typed value once it is confirmed. Setting this makes the fill
   * press Enter afterwards.
   */
  confirmWithEnter?: boolean
}
export type SavedAnswer = NewAnswer & {
  id: number
  matchType?: string
}