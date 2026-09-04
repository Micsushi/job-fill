/**
 * Shared between the content script (which relays the popup's request) and
 * the injected page script (which performs it). Kept here so the two bundles
 * cannot drift apart on the event name.
 */
export const PAGE_ACTION_EVENT = 'jaf-page-action'

export type PageAction = 'fill' | 'clear'
