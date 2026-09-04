import { renderWidget } from '../../../App'
import { BaseFormInput } from '../baseFormInput'
import { getElement } from '@src/shared/utils/getElements'
import { clearFormControls } from '../utils'

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

    // Overlay, not a sibling in the page's own layout. Inserting the widget
    // into the flow costs the field a grid/flex slot, which is what squashed
    // the date fields. Absolute positioning takes zero space instead.
    const host = this.element
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative'
    }
    Object.assign(rootElement.style, {
      position: 'absolute',
      top: '2px',
      right: '4px',
      zIndex: '20',
      display: 'inline-flex',
      alignItems: 'center',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 120ms ease-in-out',
    } as Partial<CSSStyleDeclaration>)
    host.appendChild(rootElement)

    // Stay out of the way until the field is actually being used.
    const show = () => {
      rootElement.style.opacity = '1'
      rootElement.style.pointerEvents = 'auto'
    }
    const hide = () => {
      // Don't yank the widget away while its own popup is open.
      if (rootElement.contains(document.activeElement)) return
      if (rootElement.getAttribute('data-jaf-pinned') === 'true') return
      rootElement.style.opacity = '0'
      rootElement.style.pointerEvents = 'none'
    }
    host.addEventListener('mouseenter', show)
    host.addEventListener('focusin', show)
    host.addEventListener('mouseleave', hide)
    host.addEventListener('focusout', hide)

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
