import { getElement, getElements } from '@src/shared/utils/getElements'

const SECTION_CONFIGS = [
  { prefix: 'education', xpath: './/div[contains(@class, "education--form")]' },
  { prefix: 'employment', xpath: './/div[contains(@class, "employment--form")]' },
  { prefix: 'experience', xpath: './/div[contains(@class, "experience--form")]' },
]

const SECTION_XPATH = SECTION_CONFIGS.map((c) => c.xpath).join(' | ')

const assignNumbersToSections = () => {
  SECTION_CONFIGS.forEach(({ prefix, xpath }) => {
    const sectionElements = getElements(document, xpath)
    sectionElements.forEach((element, index) => {
      element.setAttribute('jaf-section', `${prefix} ${(index + 1).toString()}`)
    })
  })
}

/**
 * not a formfield
 * registers repeating sections and gives them a number
 */
export class Section {
  static XPATH = SECTION_XPATH
  element: HTMLElement

  static async autoDiscover(node: Node = document) {
    const elements = getElements(node, this.XPATH)
    elements.forEach((el) => {
      if (!el.hasAttribute('jaf-section')) {
        // @ts-ignore
        new this(el)
      }
    })
    assignNumbersToSections()
  }

  constructor(element: HTMLElement) {
    this.element = element
    assignNumbersToSections()
    this.reassignNumberOnRemoval()
  }

  reassignNumberOnRemoval(): void {
    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      for (const m of mutations) {
        for (const node of Array.from(m.removedNodes)) {
          if (
            node instanceof HTMLElement &&
            (node.classList?.contains('education--form') ||
              node.classList?.contains('employment--form') ||
              node.classList?.contains('experience--form'))
          ) {
            assignNumbersToSections()
            observer.disconnect()
            return
          }
        }
      }
    })
    if (this.element.parentElement) {
      observer.observe(this.element.parentElement, { childList: true })
    }
  }
}
