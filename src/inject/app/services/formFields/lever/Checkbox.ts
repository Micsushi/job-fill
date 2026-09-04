import { getElements } from '@src/shared/utils/getElements'
import stringMatch from '@src/shared/utils/stringMatch'
import { LeverBaseInput } from './LeverBaseInput'

export class Checkbox extends LeverBaseInput<string[]> {
  static XPATH = [
    './/li[contains(@class, "application-question")]',
    '[.//input[@type="checkbox"]]',
  ].join('')

  fieldType = 'LeverCheckbox'

  get checkboxInputs(): HTMLInputElement[] {
    return getElements(
      this.element,
      './/input[@type="checkbox"]'
    ) as HTMLInputElement[]
  }

  listenForChanges(): void {
    this.checkboxInputs.forEach((cb) => {
      cb.addEventListener('change', () => this.triggerReactUpdate())
    })
  }

  currentValue(): string[] {
    return this.checkboxInputs
      .filter((cb) => cb.checked)
      .map((cb) => {
        const span = cb.parentElement?.querySelector(
          '.application-answer-alternative'
        ) as HTMLElement
        return span?.innerText?.trim() || cb.value || ''
      })
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    if (answers.length > 0) {
      const answerVals = answers.map((a) =>
        String(a.answer ?? '')
          .trim()
          .toLowerCase()
      )
      for (const cb of this.checkboxInputs) {
        const span = cb.parentElement?.querySelector(
          '.application-answer-alternative'
        ) as HTMLElement
        const text = (span?.innerText || cb.value || '').trim().toLowerCase()
        if (
          answerVals.some(
            (val) => text === val || stringMatch.exact(text, val)
          )
        ) {
          if (!cb.checked) {
            cb.click()
            cb.checked = true
            cb.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }
      }
    }
  }
}
