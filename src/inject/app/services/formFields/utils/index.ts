import { getElements } from '@src/shared/utils/getElements'

/**
 * given the regular dom element, get the props of the corresponding
 * react element. available as a property `__reactProps${random suffix}`
 * on the regular dom element
 */
export const getReactProps = (element: HTMLElement): any => {
  for (const key in element) {
    if (key.startsWith('__reactProps')) return element[key]
  }
}

type TextFillEvent = 'onChange' | 'onBlur'
type fillReactTextInputOptions = { eventName?: TextFillEvent }
const defaultOptions: fillReactTextInputOptions = {
  eventName: 'onChange',
}
export const fillReactTextInput = (
  input: HTMLInputElement,
  value: string,
  config: fillReactTextInputOptions = defaultOptions
): void => {
  if (!input) return
  const val = String(value ?? '')
  const prototype = Object.getPrototypeOf(input)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    'value'
  )?.set
  if (prototypeValueSetter) {
    prototypeValueSetter.call(input, val)
  } else {
    input.value = val
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))

  const reactProps = getReactProps(input)
  const eventData = {
    target: input,
    currentTarget: input,
    preventDefault: () => {},
  }
  reactProps?.[config.eventName]?.(eventData)
}


/**
 * EventListener-like interface for characterData mutations.
 */
export const addCharacterMutationObserver = (
  element: Node,
  callback: () => any
): void => {
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    if (mutations.some((mutation) => mutation.type === 'characterData')) {
      callback()
    }
  })
  observer.observe(element, {
    characterData: true,
    childList: true,
    subtree: true,
  })
}


/**
 * Empty every native control inside a field.
 *
 * Goes through `fillReactTextInput` so the value is pushed back through the
 * framework rather than only set on the DOM node: Greenhouse, Lever and
 * Workday are all controlled, and a bare `.value = ""` is reverted on the
 * next render.
 */
export const clearFormControls = (element: HTMLElement): void => {
  const controls = getElements(
    element,
    './/input | .//textarea'
  ) as (HTMLInputElement | HTMLTextAreaElement)[]

  controls.forEach((control) => {
    if (control.disabled || control.readOnly) return

    const type = (control as HTMLInputElement).type
    if (type === 'hidden' || type === 'file' || type === 'submit') return

    if (type === 'checkbox' || type === 'radio') {
      if ((control as HTMLInputElement).checked) {
        control.click()
      }
      return
    }

    if (!control.value) return
    fillReactTextInput(control as HTMLInputElement, '')
  })
}
