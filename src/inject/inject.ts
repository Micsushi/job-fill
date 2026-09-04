import { RegisterInputs as workday } from './app/services/formFields/workday'
import { RegisterInputs as greenhouse } from './app/services/formFields/greenhouse'
import { RegisterInputs as greenhouseReact } from './app/services/formFields/greenhouseReact'
import { RegisterInputs as lever } from './app/services/formFields/lever'
import { ensurePageToolbar } from './pageToolbar'

type InputSetup = (node: Node) => Promise<void>
const inputRegistrars: [string, InputSetup][] = [
  ['myworkdayjobs.com', workday],
  ['myworkdaysite.com', workday],
  ['job-boards.greenhouse.io', greenhouseReact],
  ['boards.greenhouse.io', greenhouse],
  ['boards.eu.greenhouse.io', greenhouse],
  ['lever.co', lever],
]
const matchesHost = (domain: string, site: string): boolean => {
  return domain === site || domain.endsWith(`.${site}`)
}

const getRegisterInput = (domain: string): InputSetup | undefined => {
  const match = inputRegistrars.find((site) => {
    return matchesHost(domain, site[0])
  })
  if (match) return match[1]

  // Fallback detection for ATS forms on custom/arbitrary domains
  if (document.querySelector('div[data-automation-id*="formField"], div[data-automation-id="workdayApplication"]')) {
    return workday
  }
  if (document.querySelector('.application--container, div#app[data-react-helmet]')) {
    return greenhouseReact
  }
  if (document.querySelector('form#application-form, form.application-form, ul[data-qa="multiple-choice"]')) {
    return lever
  }
  if (document.querySelector('form#application_form, #embedded_job_board_wrapper')) {
    return greenhouse
  }
  return undefined
}

const run = async () => {
  let RegisterInputs = getRegisterInput(window.location.host)
  if (RegisterInputs) {
    const observer = new MutationObserver(async (_) => {
      await RegisterInputs!(document)
      ensurePageToolbar()
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
    await RegisterInputs(document)
    ensurePageToolbar()
    return
  }

  // The host didn't match a known registrar, so watch for an ATS form that
  // renders late. Bounded: an observer that never disconnects would sit on
  // every mutation of the page for as long as the tab is open.
  const FALLBACK_TIMEOUT_MS = 30_000
  const fallbackObserver = new MutationObserver(async (_, obs) => {
    RegisterInputs = getRegisterInput(window.location.host)
    if (RegisterInputs) {
      obs.disconnect()
      const activeObserver = new MutationObserver(async (_) => {
        await RegisterInputs!(document)
        ensurePageToolbar()
      })
      activeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })
      await RegisterInputs(document)
      ensurePageToolbar()
    }
  })
  fallbackObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
  setTimeout(() => fallbackObserver.disconnect(), FALLBACK_TIMEOUT_MS)
}

/**
 * Prevent the injected script from running until the tab is revealed.
 * For example, when you open multiple tabs at once.
 */
if (!document.hidden) {
  run()
} else {
  const f = () => {
    run()
    document.removeEventListener('visibilitychange', f)
  }
  document.addEventListener('visibilitychange', f)
}
