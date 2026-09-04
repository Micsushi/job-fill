import { getElement, getElements } from '@src/shared/utils/getElements'
import stringMatch from '@src/shared/utils/stringMatch'
import { LeverBaseInput } from './LeverBaseInput'

export class RadioGroup extends LeverBaseInput<string> {
  static XPATH = [
    './/li[contains(@class, "application-question")]',
    '[.//input[@type="radio"]]',
  ].join('')

  fieldType = 'LeverRadioGroup'

  get radioInputs(): HTMLInputElement[] {
    return getElements(
      this.element,
      './/input[@type="radio"]'
    ) as HTMLInputElement[]
  }

  listenForChanges(): void {
    this.radioInputs.forEach((radio) => {
      radio.addEventListener('change', () => this.triggerReactUpdate())
    })
  }

  currentValue(): string {
    const checked = this.radioInputs.find((r) => r.checked)
    if (!checked) return ''
    const labelSpan = checked.parentElement?.querySelector(
      '.application-answer-alternative'
    ) as HTMLElement
    return labelSpan?.innerText?.trim() || checked.value || ''
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    if (answers.length > 0) {
      const answerVal = String(answers[0].answer ?? '')
        .trim()
        .toLowerCase()
      for (const radio of this.radioInputs) {
        const labelSpan = radio.parentElement?.querySelector(
          '.application-answer-alternative'
        ) as HTMLElement
        const labelText = (labelSpan?.innerText || radio.value || '')
          .trim()
          .toLowerCase()

        if (
          labelText === answerVal ||
          stringMatch.exact(labelText, answerVal) ||
          radio.value.trim().toLowerCase() === answerVal
        ) {
          radio.click()
          radio.checked = true
          radio.dispatchEvent(new Event('change', { bubbles: true }))
          break
        }
      }
    }
  }
}
