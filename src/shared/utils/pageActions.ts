/**
 * Shared between the popup, the content script (which relays the request) and
 * the injected page script (which performs it). Kept here so the bundles
 * cannot drift apart on the event and message names.
 */
export const PAGE_ACTION_EVENT = 'jaf-page-action'
export const PAGE_ACTION_RESULT_EVENT = 'jaf-page-action-result'

/** popup -> content script */
export const PAGE_ACTION_MESSAGE = 'JAF_PAGE_ACTION'
/** content script -> popup */
export const PAGE_ACTION_RESULT_MESSAGE = 'JAF_PAGE_ACTION_RESULT'

export type PageAction = 'fill' | 'clear'

export type PageActionResult = {
  action: PageAction
  total: number
  failed: number
}
