import { getElement } from '@src/shared/utils/getElements'
import { LeverBaseInput } from './LeverBaseInput'

export class Textarea extends LeverBaseInput<string> {
  static XPATH = [
    './/li[contains(@class, "application-question")]',
    '[.//textarea]',
  ].join('')

  fieldType = 'LeverTextarea'

  get textareaElement(): HTMLTextAreaElement {
    return getElement(this.element, './/textarea') as HTMLTextAreaElement
  }

  listenForChanges(): void {
    const el = this.textareaElement
    if (!el) return
    el.addEventListener('input', () => this.triggerReactUpdate())
    el.addEventListener('change', () => this.triggerReactUpdate())
  }

  currentValue(): string {
    return this.textareaElement?.value || ''
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    if (answers.length > 0 && this.textareaElement) {
      const firstAnswer = answers[0]
      const textarea = this.textareaElement
      const val = String(firstAnswer.answer ?? '')

      const prototype = Object.getPrototypeOf(textarea)
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(
        prototype,
        'value'
      )?.set
      if (prototypeValueSetter) {
        prototypeValueSetter.call(textarea, val)
      } else {
        textarea.value = val
      }

      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
}
