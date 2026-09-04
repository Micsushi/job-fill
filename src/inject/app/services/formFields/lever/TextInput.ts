import { getElement } from '@src/shared/utils/getElements'
import { LeverBaseInput } from './LeverBaseInput'

export class TextInput extends LeverBaseInput<string> {
  static XPATH = [
    './/li[contains(@class, "application-question")]',
    '[.//input[not(@type="hidden") and not(@type="file") and not(@type="radio") and not(@type="checkbox") and not(@type="submit")]]',
  ].join('')

  fieldType = 'LeverTextInput'

  get inputElement(): HTMLInputElement {
    return getElement(
      this.element,
      './/input[not(@type="hidden") and not(@type="file") and not(@type="radio") and not(@type="checkbox") and not(@type="submit")]'
    ) as HTMLInputElement
  }

  listenForChanges(): void {
    const el = this.inputElement
    if (!el) return
    el.addEventListener('input', () => this.triggerReactUpdate())
    el.addEventListener('change', () => this.triggerReactUpdate())
  }

  currentValue(): string {
    return this.inputElement?.value || ''
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    if (answers.length > 0 && this.inputElement) {
      const firstAnswer = answers[0]
      const input = this.inputElement
      const val = String(firstAnswer.answer ?? '')

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
    }
  }
}
