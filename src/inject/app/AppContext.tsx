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
import { Answer } from '@src/shared/utils/types'
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

  /**
   * Saving an empty field is almost always a misclick, and the resulting
   * blank answer then competes with the real one at fill time.
   */
  const isEmptyAnswer = (value: any): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
  }

  const confirmedNotEmpty = (snapshot: Answer | null): boolean => {
    if (!snapshot || !isEmptyAnswer(snapshot.answer)) return true

    // React re-renders these forms and can swap the field's DOM node out from
    // under us. This instance would then be reading a detached copy, whose
    // value stopped changing the moment it left the page -- which looks
    // exactly like an empty field.
    const detached = !document.contains(backend.element)
    // Which control is this instance actually bound to? If it is not the one
    // on screen, that is the bug, and this says so outright.
    const probe = backend.element.querySelector(
      'input, textarea, select'
    ) as HTMLInputElement | null
    debugError('empty-save check', {
      fieldName: backend.fieldName,
      read: snapshot.answer,
      detached,
      fieldType: backend.fieldType,
      elementClass: backend.element.className,
      boundControlId: probe?.id,
      boundControlType: probe?.type,
      boundControlValue: probe?.value,
    })

    if (detached) {
      window.alert(
        `Job Fill lost track of "${backend.fieldName}" because the page ` +
          `re-rendered it. Reload the page and try again -- nothing was saved.`
      )
      return false
    }

    return window.confirm(
      `"${backend.fieldName}" is empty. Save it as a blank answer anyway?`
    )
  }

  const handleSaveAsExtra = async () => {
    const snapshot = await backend.fieldSnapshotForSave()
    if (!confirmedNotEmpty(snapshot)) return
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
    if (!confirmedNotEmpty(snapshot)) return
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
