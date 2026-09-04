import { renderWidget } from '../../../App'
import { BaseFormInput } from '../baseFormInput'
import { getElement } from '@src/shared/utils/getElements'
import { clearFormControls } from '../utils'

export abstract class LeverBaseInput<AnswerType> extends BaseFormInput<AnswerType> {
  get labelDisplayElement(): HTMLElement {
    return this.labelElement
  }

  get labelElement(): HTMLElement {
    return (
      getElement(this.element, './/*[contains(@class, "application-label")]') ||
      getElement(this.element, './/label')
    )
  }

  /**
   * Lever has no repeating sections. Its application form is a flat list:
   * fixed fields (name, email, resume), `urls[LinkedIn]` style link fields,
   * and custom question cards named `cards[<uuid>][fieldN]`, where the uuid
   * identifies the card rather than a repeat index and changes per posting.
   * There is no "Add another" anywhere, so a blank section is correct, and
   * keying off the uuid would stop answers carrying between postings.
   */
  public get section(): string {
    return ''
  }

  attachReactApp(app: React.ReactNode, inputContainer: HTMLElement): void {
    const rootElement = document.createElement('div')
    rootElement.classList.add('jaf-widget')
    rootElement.style.display = 'inline-flex'
    rootElement.style.alignItems = 'center'
    rootElement.style.margin = '4px 0'

    const field = getElement(
      this.element,
      './/*[contains(@class, "application-field")]'
    )
    if (field) {
      field.insertAdjacentElement('beforebegin', rootElement)
    } else {
      this.element.insertAdjacentElement('afterbegin', rootElement)
    }
    renderWidget(rootElement, app)
  }

  /**
   * Reset every control in this field.
   */
  async clear(): Promise<void> {
    clearFormControls(this.element)
    this.triggerReactUpdate()
  }

}
