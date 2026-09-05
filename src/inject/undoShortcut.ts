import { registeredInputs } from './app/services/formFields/baseFormInput'
import { contentScriptAPI } from './app/services/contentScriptApi'
import { debugError } from '@src/shared/utils/debug'

/** Fired after storage changes so every widget reloads its answers. */
export const ANSWERS_CHANGED_EVENT = 'jaf-answers-changed'

const isTextEntry = (el: EventTarget | null): boolean => {
  const node = el as HTMLElement | null
  if (!node || !node.tagName) return false
  if (node.isContentEditable) return true
  const tag = node.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

/**
 * Ctrl+Z / Ctrl+Shift+Z on the page.
 *
 * Only when focus is outside a text control: inside one, undo belongs to the
 * browser, and taking it would lose the user their normal editing history
 * mid-application.
 */
export const listenForUndoShortcut = (): void => {
  document.addEventListener(
    'keydown',
    async (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      if (isTextEntry(e.target) || isTextEntry(document.activeElement)) return

      e.preventDefault()
      try {
        const method = e.shiftKey ? 'redoAnswer' : 'undoAnswer'
        const res = await contentScriptAPI.send(method)
        if (!res.ok) return
        // Answers moved underneath the widgets; make them re-read.
        document.dispatchEvent(new CustomEvent(ANSWERS_CHANGED_EVENT))
        registeredInputs().forEach((input) => input.triggerReactUpdate())
      } catch (err) {
        debugError('undo shortcut failed', err)
      }
    },
    true
  )
}
