import { registeredInputs } from './app/services/formFields/baseFormInput'
import {
  PAGE_ACTION_EVENT,
  PageAction,
} from '@src/shared/utils/pageActions'

/**
 * Page wide fill/clear, driven from the extension popup rather than an
 * on-page toolbar so nothing is painted over the host site.
 *
 * The popup can only talk to the content script, and the field instances live
 * in the page's own context, so the content script relays a DOM event that
 * this listener picks up.
 */
export type PageActionResult = {
  total: number
  failed: number
}

/**
 * Runs one at a time on purpose: these are controlled react forms, and
 * firing every onChange in the same tick makes react-select drop updates.
 */
const runAction = async (action: PageAction): Promise<PageActionResult> => {
  const inputs = registeredInputs()
  let failed = 0

  for (const input of inputs) {
    try {
      await input[action]()
    } catch (err) {
      failed++
      console.warn(`Job Fill: ${action} failed for a field`, err)
    }
  }

  return { total: inputs.length, failed }
}

export const listenForPageActions = (): void => {
  document.addEventListener(PAGE_ACTION_EVENT, (event: Event) => {
    const action = (event as CustomEvent).detail as PageAction
    if (action !== 'fill' && action !== 'clear') return
    runAction(action)
  })
}
