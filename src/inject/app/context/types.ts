import { AnswerActions, AnswerState } from "../hooks/useAnswerState"
import { PopperState } from "../hooks/usePopperState"
import { BaseFormInput } from "../services/formFields/baseFormInput"

export type FillButtonState = {
  isDisabled: boolean
  onClick: () => Promise<void>
  isFilled: boolean
}

export type LocalAnswer = [string, boolean]



export interface AppContextType {
  backend: BaseFormInput
  refreshCurrentValue: () => Promise<void>
  init: () => Promise<void>
  answers: AnswerState & AnswerActions
  addNewAnswerComponent: React.FC | null
  fillButton: FillButtonState
  saveButton: SaveButtonState
  deleteAnswer: (id: number) => Promise<void>
  currentValue: unknown
  setCurrentValue: (_: unknown) => void
  isFilled: boolean
  moreInfoPopper: PopperState
  fieldNotice: string | null
}

export type SaveButtonState = {
  showSuccessBadge: boolean
  clickHandler: () => void
}