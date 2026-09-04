import { renderWidget } from '../../../App'
import { BaseFormInput } from '../baseFormInput'
import { getElement } from '@src/shared/utils/getElements'
import { createKeyboardEvent } from '@src/shared/utils/events'
import { sleep } from '@src/shared/utils/async'
import { clearFormControls } from '../utils'
import { anchorWidget, widgetAnchorFor } from '../utils/widgetAnchor'

export abstract class GreenhouseReactBaseInput<
  AnswerType
> extends BaseFormInput<AnswerType> {
  get labelDisplayElement(): HTMLElement {
    return this.labelElement
  }
  abstract get labelElement(): HTMLElement

  sectionElement(): HTMLElement {
    return getElement(
      this.element,
      `ancestor::div[@jaf-section][1]`
    )
  }

  get section(): string {
    return this.sectionElement()?.getAttribute("jaf-section") || ""
  }
  attachReactApp(app: React.ReactNode, inputContainer: HTMLElement): void {
    const rootElement = document.createElement('div')
    rootElement.classList.add('jaf-widget')
    anchorWidget(
      rootElement,
      widgetAnchorFor(this.labelDisplayElement, this.element)
    )
    renderWidget(rootElement, app)
  }

  /**
   * The control this field's label points at.
   *
   * Taking the first input in the wrapper is not safe: Greenhouse mounts an
   * intl-tel-input country search box ahead of the real phone input after
   * hydration, so `.//input` returned a permanently empty search field. The
   * label's `for` attribute names the control the label belongs to, which is
   * the only reliable answer.
   */
  protected controlFromLabel<T extends HTMLElement>(fallbackXpath: string): T {
    const forId = this.labelElement?.getAttribute('for')
    if (forId) {
      const byId = this.element.querySelector(`[id="${CSS.escape(forId)}"]`)
      if (byId) return byId as T
    }
    return getElement(this.element, fallbackXpath) as T
  }

  /**
   * Commit a value the control is holding but has not accepted yet.
   *
   * Searchable dropdowns and the phone country picker keep a typed value in
   * limbo until it is confirmed, so moving to the next field discards it.
   */
  async pressEnter(control?: HTMLElement): Promise<void> {
    const target =
      control || (getElement(this.element, './/input | .//textarea') as HTMLElement)
    if (!target) return
    target.focus()
    await sleep(30)
    target.dispatchEvent(createKeyboardEvent('keydown', 'Enter'))
    target.dispatchEvent(createKeyboardEvent('keyup', 'Enter'))
  }

  /**
   * Reset every control in this field.
   */
  async clear(): Promise<void> {
    clearFormControls(this.element)
    this.triggerReactUpdate()
  }
}
