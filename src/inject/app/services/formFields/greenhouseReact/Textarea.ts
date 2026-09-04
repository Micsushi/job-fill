import { getElement } from "@src/shared/utils/getElements";
import { fillReactTextInput } from "../utils";
import { GreenhouseReactBaseInput } from "./GreenhouseReactBaseInput";
import { xpaths } from "./xpaths";



export class Textarea extends GreenhouseReactBaseInput<any> {
  static XPATH = xpaths.TEXTAREA
  fieldType = 'TextInput'
  
  get labelElement(): HTMLElement {
    return getElement(this.element, `.//label`)
  }

  get inputElement(): HTMLInputElement {
    return this.controlFromLabel<HTMLInputElement>('.//textarea')
  }

  listenForChanges(): void {
    this.inputElement.addEventListener("input", () => {
      this.triggerReactUpdate()
    })
  }

  currentValue() {
    return this.inputElement.value
  }
  async fill(): Promise<void> {
    const answers = await this.answer()
    if (answers.length === 0) return
    // fillReactTextInput goes through the native value setter and dispatches
    // real input/change events. Assigning `.value` directly and calling
    // react's onChange with `{currentTarget}` leaves react's value tracker
    // thinking nothing changed, and hands a handler reading `event.target`
    // an undefined value.
    fillReactTextInput(this.inputElement, answers[0].answer)
    if (answers[0].confirmWithEnter) {
      await this.pressEnter(this.inputElement)
    }

  }
}