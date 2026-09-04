import { Answer } from '@src/shared/utils/types'
import { AppContextType } from '../AppContext'
import { contentScriptAPI } from '../services/contentScriptApi'

export interface SaveButtonClickHndler {
  (
    newAnswer: Answer | null,
    context: Pick<
      AppContextType,
      'moreInfoPopper' | 'init' | 'editableAnswerState' | 'backend'
    >
  ): void | Promise<void>
}

const basic: SaveButtonClickHndler = async (newAnswer, { init }) => {
  if (!newAnswer) return
  const resp = await contentScriptAPI.send('addAnswer', newAnswer)
  if (resp.ok) {
    await init()
  }
}

/**
 * File fields. If the user has already attached a document to the form we can
 * capture it straight from the field, which is the whole point: no need to
 * re-upload it inside the answers panel first. Falls back to the old notice
 * when the field is empty and there is nothing to grab.
 */
const fileAware: SaveButtonClickHndler = async (newAnswer, context) => {
  if (!newAnswer) {
    context.moreInfoPopper.open()
    return
  }
  await basic(newAnswer, context)
}

const withNotice: SaveButtonClickHndler = async (
  newAnswer,
  { moreInfoPopper }
) => {
  moreInfoPopper.open()
}

const backupAnswerList: SaveButtonClickHndler = async (
  newAnswer,
  { editableAnswerState, backend }
) => {
  const { answers, init } = editableAnswerState
  if (answers.length === 0) {
    await backend.save(newAnswer)
    await init()
  } else if (answers[0].originalAnswer.matchType === 'exact') {
    // make a popup that says to add a new answer
  }
}

export const saveButtonClickHandlers = {
  backupAnswerList,
  basic,
  fileAware,
  withNotice,
}
