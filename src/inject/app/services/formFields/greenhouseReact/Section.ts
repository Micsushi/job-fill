import { getElements } from '@src/shared/utils/getElements'

/**
 * A repeating group is a container holding an "Add another" button. Greenhouse
 * names them consistently: `education--container` wraps N `education--form`
 * entries, and the controls inside carry a `--0`, `--1` id suffix.
 *
 * Detecting the container by its button rather than by a list of known class
 * names means employment, experience and any other repeating group a board
 * renders are picked up without having to guess what they're called.
 */
const SECTION_XPATH =
  './/div[./button[contains(@class, "add-another-button")]]'

/** `education--container` -> `education`. */
const groupName = (container: HTMLElement): string => {
  const match = Array.from(container.classList)
    .map((c) => /^(.+)--container$/.exec(c))
    .find(Boolean)
  return match ? match[1] : 'section'
}

const isEntry = (el: Element): el is HTMLElement => {
  return (
    el instanceof HTMLElement &&
    el.tagName !== 'BUTTON' &&
    Boolean(el.querySelector('input, textarea, select'))
  )
}

/**
 * Number every entry in every repeating group. Runs on each pass rather than
 * only when a section is added, so removing the middle entry of three
 * renumbers the rest instead of leaving a gap.
 */
const assignNumbersToSections = () => {
  getElements(document, SECTION_XPATH).forEach((container) => {
    const prefix = groupName(container)
    Array.from(container.children)
      .filter(isEntry)
      .forEach((entry, index) => {
        entry.setAttribute('jaf-section', `${prefix} ${index + 1}`)
      })
  })
}

/**
 * Not a form field. Tags repeating sections so answers saved against
 * "education 2" only ever fill the second education entry, and an entry with
 * no saved answers is left alone.
 */
export class Section {
  static XPATH = SECTION_XPATH
  element: HTMLElement

  static async autoDiscover(_node: Node = document) {
    assignNumbersToSections()
  }

  constructor(element: HTMLElement) {
    this.element = element
    assignNumbersToSections()
  }
}
