/**
 * Opt-in diagnostics.
 *
 * Enable from the page console, then reload:
 *   localStorage.jobFillDebug = '1'
 * Disable with:
 *   delete localStorage.jobFillDebug
 *
 * Off by default so we never spam a user's console, but failures are always
 * reported through `debugError` regardless of the flag.
 */
const FLAG = 'jobFillDebug'

let enabled: boolean | null = null

export const debugEnabled = (): boolean => {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(FLAG) === '1'
    } catch {
      // Some pages deny storage access; treat that as disabled.
      enabled = false
    }
  }
  return enabled
}

export const debugLog = (...args: any[]): void => {
  if (!debugEnabled()) return
  console.log('%c[Job Fill]', 'color:#00897b;font-weight:bold', ...args)
}

/** Always reported: a failure the user may need to act on. */
export const debugError = (...args: any[]): void => {
  console.warn('%c[Job Fill]', 'color:#ef6c00;font-weight:bold', ...args)
}

/**
 * Group a field's diagnostics under its own label so a page with 30 fields
 * stays readable.
 */
export const debugField = (
  label: string,
  detail: Record<string, unknown>
): void => {
  if (!debugEnabled()) return
  console.log(
    '%c[Job Fill]%c ' + label,
    'color:#00897b;font-weight:bold',
    'color:inherit',
    detail
  )
}
