import { Server } from '@src/shared/utils/crossContextCommunication/server'
import { FieldPath, Answer } from '@src/shared/utils/types'
import { EVENT_LISTENER_ID, loadApp } from './app/App'
import {
  PAGE_ACTION_EVENT,
  PAGE_ACTION_MESSAGE,
  PAGE_ACTION_RESULT_EVENT,
  PAGE_ACTION_RESULT_MESSAGE,
  PageActionResult,
} from '@src/shared/utils/pageActions'
import { answers1010, migrate1010 } from './utils/storage/Answers1010'
import {
  documentKindFor,
  getDefaultDocuments,
} from '@src/shared/utils/storage/defaultDocuments'
import { convert106To1010, convert1010To106 } from './utils/storage/DataStore'
import { SavedAnswer } from './utils/storage/DataStoreTypes'
import { migrateEducation } from './utils/storage/migrateEducationSectionNames'

// Regiser server and methods accessible to injected script.
const server = new Server(process.env.CONTENT_SCRIPT_URL)
server.register('addAnswer', async (newAnswer: Answer) => {
  const answer1010 = answers1010.add(convert106To1010(newAnswer))
  return convert1010To106(answer1010)
})

server.register('updateAnswer', async (newAnswer: Answer) => {
  const answer1010 = answers1010.update(
    convert106To1010(newAnswer) as SavedAnswer
  )
  return convert1010To106(answer1010)
})

server.register('getAnswer', async (fieldPath: FieldPath) => {
  return answers1010.search(fieldPath).map((record) => convert1010To106(record))
})

/** Fallback document for a file field that has no answer of its own. */
server.register('getDefaultDocument', async (fieldName: string) => {
  const docs = await getDefaultDocuments()
  return docs[documentKindFor(fieldName)] || null
})

server.register('undoAnswer', async () => answers1010.undo())
server.register('redoAnswer', async () => answers1010.redo())

server.register('deleteAnswer', async (id: number) => {
  return answers1010.delete(id)
})

// inject script
function injectScript(filePath: string) {
  const script = document.createElement('script')
  script.src = chrome.runtime.getURL(filePath)
  script.setAttribute('async', 'true')
  script.type = 'module'
  script.onload = function () {
    script.remove()
  }
  ;(document.head || document.documentElement).appendChild(script)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_WHATS_NEW') {
    document.dispatchEvent(new CustomEvent(EVENT_LISTENER_ID))
  }
  // Relay page wide fill/clear from the popup. The field instances live in
  // the page's own context, which the popup cannot reach directly.
  if (message.type === PAGE_ACTION_MESSAGE) {
    document.dispatchEvent(
      new CustomEvent(PAGE_ACTION_EVENT, { detail: message.action })
    )
    sendResponse({ ok: true })
  }
})

// Carry the page's result back to the popup, if it is still open.
document.addEventListener(PAGE_ACTION_RESULT_EVENT, (event: Event) => {
  const result = (event as CustomEvent).detail as PageActionResult
  chrome.runtime
    .sendMessage({ type: PAGE_ACTION_RESULT_MESSAGE, result })
    .catch(() => {
      // Popup already closed. Nothing to report to.
    })
})

const run = async () => {
  await answers1010.load()
  await migrate1010()
  await migrateEducation()
  injectScript('inject.js')
  loadApp()
}

run()
