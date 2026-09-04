import { registeredInputs } from './app/services/formFields/baseFormInput'
import {
  PAGE_ACTION_EVENT,
  PAGE_ACTION_RESULT_EVENT,
  PageAction,
  PageActionResult,
} from '@src/shared/utils/pageActions'

/**
 * Page wide fill/clear, driven from the extension popup rather than an
 * on-page toolbar so nothing is painted over the host site.
 *
 * The popup can only talk to the content script, and the field instances live
 * in the page's own context, so the content script relays a DOM event in and
 * carries the result back out.
 */

/**
 * Runs one field at a time on purpose: these are controlled react forms, and
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

  return { action, total: inputs.length, failed }
}

export const listenForPageActions = (): void => {
  document.addEventListener(PAGE_ACTION_EVENT, async (event: Event) => {
    const action = (event as CustomEvent).detail as PageAction
    if (action !== 'fill' && action !== 'clear') return

    const result = await runAction(action)
    document.dispatchEvent(
      new CustomEvent(PAGE_ACTION_RESULT_EVENT, { detail: result })
    )
  })
}
