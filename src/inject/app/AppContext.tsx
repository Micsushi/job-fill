import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { BaseFormInput } from './services/formFields/baseFormInput'
import { EditableAnswerState } from './hooks/useEditableAnswerState'
import { PopperState, usePopperState } from './hooks/usePopperState'
import { contentScriptAPI } from './services/contentScriptApi'
import { debugError, debugField } from '@src/shared/utils/debug'

export type FillButtonState = {
  isDisabled: boolean
  onClick: () => Promise<void>
  isFilled: boolean
}

export type SaveButtonState = {
  showSuccessBadge: boolean
  /** True once this field has at least one stored answer. */
  hasExistingAnswers: boolean
  /** Store the current value alongside whatever is already saved. */
  clickHandler: () => void
  /** Drop every stored answer for this field and keep only the current value. */
  replaceHandler: () => void
}

export type LocalAnswer = [string, Boolean]

export interface AppContextType {
  backend: BaseFormInput<any>
  refresh: () => Promise<void>
  init: () => Promise<void>
  fillButton: FillButtonState
  saveButton: SaveButtonState
  deleteAnswer: (id: number) => Promise<void>
  currentValue: any
  setCurrentValue: (_: any) => void
  isFilled: boolean
  editableAnswer: LocalAnswer[]
  setEditableAnswer: Dispatch<SetStateAction<LocalAnswer[]>>
  editableAnswerState: EditableAnswerState
  moreInfoPopper: PopperState

  fieldNotice: string | null
}

const AppContext = createContext<AppContextType>(null)

export const useAppContext = () => useContext(AppContext)

export const ContextProvider: FC<{
  children: ReactNode
  backend: BaseFormInput<any>
}> = ({ children, backend }) => {
  const [currentValue, setCurrentValue] = useState<any>(null)
  const [fillButtonDisabled, setFillButtonDisabled] = useState<boolean>(false)
  const [editableAnswer, setEditableAnswer] = useState<LocalAnswer[]>([])
  const editableAnswerState: EditableAnswerState =
    backend.editableAnswerHook(backend)
  const fieldNotice = backend.fieldNotice
  useEffect(() => {
    ;(async () => {
      try {
        await editableAnswerState.init()
        await refresh()
        const before = backend.currentValue()
        await handleFill()
        const after = backend.currentValue()
        debugField(backend.fieldName || '(no label)', {
          fieldType: backend.fieldType,
          section: backend.section || '(none)',
          savedAnswers: editableAnswerState.answers.length,
          valueBefore: before,
          valueAfter: after,
          changed: before !== after,
        })
      } catch (err) {
        debugError(`init failed for "${backend.fieldName}"`, err)
      }
    })()
    backend.element.addEventListener(backend.reactMessageEventId, refresh)
    return () => {
      backend.element.removeEventListener(backend.reactMessageEventId, refresh)
    }
  }, [])

  const init = async () => {
    await editableAnswerState.init()
    await refresh()
  }

  const refresh = async () => {
    setCurrentValue(backend.currentValue())
  }

  const isFilled =
    editableAnswerState.answers.length > 0 &&
    backend.isFilled(
      backend.currentValue(),
      backend.answerValue.prepForFill(editableAnswerState.answers)
    )

  const deleteAnswer: AppContextType['deleteAnswer'] = async (id: number) => {
    await backend.deleteAnswer(id)
    await refresh()
  }

  const handleFill = async () => {
    setFillButtonDisabled(true)
    try {
      await backend.fill()
      await refresh()
    } catch (err) {
      // Previously this rejected into the caller and stopped the rest of a
      // page level fill. Report it and carry on to the next field.
      debugError(`fill failed for "${backend.fieldName}"`, err)
    } finally {
      setFillButtonDisabled(false)
    }
  }
  const {saveButtonClickHandler} = backend
  const moreInfoPopper = usePopperState({init, backend})

  /** Human readable form of a stored answer, for the replace confirmation. */
  const describe = (value: any): string => {
    if (value === null || value === undefined || value === '') return '(empty)'
    if (typeof value === 'object') {
      return value.name || JSON.stringify(value)
    }
    return String(value)
  }

  const handleSaveAsExtra = async () => {
    const snapshot = await backend.fieldSnapshotForSave()
    saveButtonClickHandler(snapshot, {
      moreInfoPopper,
      init,
      editableAnswerState,
      backend,
    })
  }

  /**
   * Replace every stored answer for this field with the current value.
   * Destructive, so the confirmation spells out exactly what is being dropped.
   */
  const handleReplaceAll = async () => {
    const snapshot = await backend.fieldSnapshotForSave()
    if (!snapshot) {
      moreInfoPopper.open()
      return
    }
    const existing = editableAnswerState.answers
    const confirmed = window.confirm(
      [
        `Replace every saved answer for "${backend.fieldName}"?`,
        '',
        `These ${existing.length} saved answer(s) will be deleted:`,
        ...existing.map((a) => `  - ${describe(a.originalAnswer.answer)}`),
        '',
        'and replaced with:',
        `  - ${describe(snapshot.answer)}`,
      ].join('\n')
    )
    if (!confirmed) return

    for (const answer of existing) {
      const id = answer.originalAnswer.id
      if (typeof id === 'number') {
        await backend.deleteAnswer(id)
      }
    }
    await contentScriptAPI.send('addAnswer', snapshot)
    await init()
  }
  const value: AppContextType = {
    backend,
    refresh,
    init,
    deleteAnswer,
    editableAnswer,
    setEditableAnswer,
    currentValue,
    setCurrentValue,
    isFilled,
    moreInfoPopper,
    editableAnswerState,
    fieldNotice,
    fillButton: {
      isDisabled: fillButtonDisabled,
      onClick: handleFill,
      isFilled: editableAnswerState.answers.length > 0 && isFilled,
    },
    saveButton: {
      showSuccessBadge: editableAnswerState.answers.length > 0,
      hasExistingAnswers: editableAnswerState.answers.length > 0,
      clickHandler: handleSaveAsExtra,
      replaceHandler: handleReplaceAll,
    },
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
