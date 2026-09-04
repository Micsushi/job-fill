import { getElement } from '@src/shared/utils/getElements'
import stringMatch from '@src/shared/utils/stringMatch'
import { LeverBaseInput } from './LeverBaseInput'

export class Dropdown extends LeverBaseInput<string> {
  static XPATH = [
    './/li[contains(@class, "application-question")]',
    '[.//select]',
  ].join('')

  fieldType = 'LeverDropdown'

  get selectElement(): HTMLSelectElement {
    return getElement(this.element, './/select') as HTMLSelectElement
  }

  listenForChanges(): void {
    const el = this.selectElement
    if (!el) return
    el.addEventListener('change', () => this.triggerReactUpdate())
  }

  currentValue(): string {
    const sel = this.selectElement
    if (!sel || sel.selectedIndex < 0) return ''
    return sel.options[sel.selectedIndex]?.text?.trim() || sel.value || ''
  }

  async fill(): Promise<void> {
    const answers = await this.answer()
    if (answers.length > 0 && this.selectElement) {
      const answerVal = String(answers[0].answer ?? '')
        .trim()
        .toLowerCase()
      const sel = this.selectElement
      for (let i = 0; i < sel.options.length; i++) {
        const opt = sel.options[i]
        const optText = opt.text.trim().toLowerCase()
        const optVal = opt.value.trim().toLowerCase()
        if (
          optText === answerVal ||
          stringMatch.exact(optText, answerVal) ||
          optVal === answerVal
        ) {
          sel.selectedIndex = i
          sel.value = opt.value
          sel.dispatchEvent(new Event('change', { bubbles: true }))
          break
        }
      }
    }
  }
}
