import { registeredInputs } from './app/services/formFields/baseFormInput'

const TOOLBAR_ID = 'jaf-page-toolbar'

const TEAL = '#00897b'

const button = (label: string, primary: boolean): HTMLButtonElement => {
  const el = document.createElement('button')
  el.type = 'button'
  el.textContent = label
  Object.assign(el.style, {
    font: '500 12px/1 system-ui, sans-serif',
    padding: '7px 12px',
    borderRadius: '6px',
    border: primary ? 'none' : `1px solid ${TEAL}`,
    background: primary ? TEAL : '#ffffff',
    color: primary ? '#ffffff' : TEAL,
    cursor: 'pointer',
  } as Partial<CSSStyleDeclaration>)
  return el
}

/**
 * Run an action against every field on the page, one at a time.
 *
 * Sequential on purpose: these forms are controlled react components and
 * firing every onChange in the same tick makes react-select in particular
 * drop updates.
 */
const forEachField = async (
  action: 'fill' | 'clear',
  status: HTMLElement
): Promise<void> => {
  const inputs = registeredInputs()
  let done = 0
  let failed = 0

  for (const input of inputs) {
    try {
      await input[action]()
    } catch (err) {
      failed++
      console.warn(`JobAppFiller: ${action} failed for a field`, err)
    }
    done++
    status.textContent = `${done}/${inputs.length}`
  }

  status.textContent = failed
    ? `${done - failed}/${inputs.length}, ${failed} skipped`
    : `${done}/${inputs.length} done`
  setTimeout(() => {
    status.textContent = `${inputs.length} fields`
  }, 4000)
}

/**
 * Idempotent. Called from the same place the field registrars run, so if the
 * page (or react hydration) removes the toolbar it comes straight back.
 */
export const ensurePageToolbar = (): void => {
  if (document.getElementById(TOOLBAR_ID)) return
  if (!document.body) return
  if (registeredInputs().length === 0) return

  const bar = document.createElement('div')
  bar.id = TOOLBAR_ID
  Object.assign(bar.style, {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '10px',
    background: '#ffffff',
    boxShadow: '0 2px 12px rgba(0,0,0,.25)',
  } as Partial<CSSStyleDeclaration>)

  const status = document.createElement('span')
  status.textContent = `${registeredInputs().length} fields`
  Object.assign(status.style, {
    font: '400 11px/1 system-ui, sans-serif',
    color: '#546e7a',
  } as Partial<CSSStyleDeclaration>)

  const fill = button('Fill page', true)
  fill.onclick = () => forEachField('fill', status)

  const clear = button('Clear page', false)
  clear.onclick = () => {
    if (window.confirm('Clear every field Job App Filler manages on this page?')) {
      forEachField('clear', status)
    }
  }

  bar.append(status, fill, clear)
  document.body.appendChild(bar)
}
