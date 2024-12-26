import { getElement } from "@src/shared/utils/getElements"
import { fillReactTextInput } from "../utils"
import { WorkdayBaseInput } from "./WorkdayBaseInput"
import { xpaths } from "./xpaths"
import StringAnswerDTO from "../../DTOs/StringAnswerDTO"

export class Password extends WorkdayBaseInput {
  static XPATH = xpaths.PASSWORD_INPUT
  fieldType = 'PasswordInput'

  get inputElement(): HTMLInputElement {
    return getElement(this.element, './/input') as HTMLInputElement
  }

  currentValue() {
    return this.inputElement.value
  }

  listenForChanges() {
    this.inputElement.addEventListener('input', () => {
      this.triggerReactUpdate()
    })
  }

  public isFilled(current: any, stored: any[]): boolean {
    return current === stored[0]
  }

  async fill(answers: StringAnswerDTO[]) {
    fillReactTextInput(this.inputElement, answers[0].answer)
  }
}