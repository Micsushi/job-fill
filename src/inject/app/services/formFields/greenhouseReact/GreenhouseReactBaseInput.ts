import { renderWidget } from '../../../App'
import { BaseFormInput } from '../baseFormInput'
import { getElement } from '@src/shared/utils/getElements'
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
   * Reset every control in this field.
   */
  async clear(): Promise<void> {
    clearFormControls(this.element)
    this.triggerReactUpdate()
  }
}
