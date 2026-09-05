import { AnswerValueSingleFileUpload } from "../../../MoreInfoPopup/AnswerDisplay/AnswerValueDisplay/AnswerValueSingleFileUpload";
import { sleep } from "@src/shared/utils/async";
import fieldFillerQueue from "@src/shared/utils/fieldFillerQueue";
import { fileToLocalStorage, localStorageToFile } from "@src/shared/utils/file";
import { getElement } from "@src/shared/utils/getElements";
import { AnswerValueMethods, } from "../baseFormInput";
import { getReactProps } from "../utils";
import { GreenhouseReactBaseInput } from "./GreenhouseReactBaseInput";
import { xpaths } from "./xpaths";
import { Answer } from "@src/shared/utils/types";
import { saveButtonClickHandlers } from "../../../hooks/saveButtonClickHandlers";
import { contentScriptAPI } from '../../contentScriptApi'


export class File extends GreenhouseReactBaseInput<any> {
  static XPATH = xpaths.FILE
  fieldType = 'SingleFileUpload'
  public saveButtonClickHandler = saveButtonClickHandlers.fileAware
  fieldNotice = "Attach a file here and hit save, or upload one in the 'Answers' section below."
  fieldNoticeLink = {
    display: "See How",
    url: "https://www.youtube.com/watch?v=JYMATq9siIY&t=134s"
  }
  get answerValue() {
    return {
      ...super.answerValue,
      displayComponent: AnswerValueSingleFileUpload,
    } as AnswerValueMethods
  }
  get labelElement(): HTMLElement {
    return getElement(this.element, 
      `.//div[contains(@class, "label")]`
    )
  }

  /**
   * The File object the user last attached, captured at selection time.
   * Reading it back off the input later is unreliable: Greenhouse is a
   * controlled component and may reset the native input after handling it.
   */
  private capturedFile: globalThis.File | null = null

  /**
   * Capture whatever is already attached to the form field, so the save
   * button can store a resume without the user re-uploading it in the
   * answers panel first. Returns null when the field is empty.
   */
  async fieldSnapshotForSave(): Promise<Answer | null> {
    const file = this.capturedFile || this.inputElement?.files?.[0] || null
    if (!file) return null
    return {
      path: this.path,
      answer: await fileToLocalStorage(file),
    }
  }

  /**
   * Delegated on the field rather than bound to the input itself: these forms
   * re-render and swap the native input out, which would drop a direct
   * listener. Capture phase because `change` does not bubble.
   */
  private watchForFileSelection(): void {
    this.element.addEventListener(
      'change',
      (event: Event) => {
        const target = event.target as HTMLInputElement | null
        if (target?.type !== 'file') return
        this.capturedFile = target.files?.[0] ?? null
      },
      true
    )
  }

  listenForChanges(): void {
    this.watchForFileSelection()

    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      const XPATH = `self::*[starts-with(@class, "file-upload__filename")]`
      if (getElement(mutations, XPATH)) {
        this.triggerReactUpdate()
      }
    })
    observer.observe(this.element, {
      childList: true,
      subtree: true,
    })
  }
  currentValue() {
    return getElement(
      this.element,
      `.//div[@class="file-upload__filename"]`
    )?.innerText || ""

  }

  get deleteButtonElement(): HTMLElement {
    return getElement(
      this.element,
      ".//button[@aria-label='Remove file']"
    )
  }
  get inputElement(): HTMLInputElement {
    return getElement(
      this.element,
      `.//input[@type="file"]`
    ) as HTMLInputElement
  }

  public isFilled(current: any, stored: any[]): boolean {
    return current === stored[0].name
  }

  
  /**
   * The answer saved against this exact field, or the account-wide default
   * document. Without the fallback a resume has to be saved once per field
   * per site, which is the manual step this replaces.
   */
  private async fileToFill(): Promise<any | null> {
    const answers = await this.answer()
    if (answers.length > 0) return answers[0].answer
    try {
      const res = await contentScriptAPI.send(
        'getDefaultDocument',
        this.fieldName
      )
      return res.ok ? res.data : null
    } catch {
      return null
    }
  }

  async fill(): Promise<void> {
    await fieldFillerQueue.enqueue(async () => {
      const stored = await this.fileToFill()
      if (!stored) return
      if (this.deleteButtonElement) {
        this.deleteButtonElement.click()
        await sleep(500)
      }
      const file = localStorageToFile(stored)
      const reactProps = getReactProps(this.inputElement)
      reactProps?.onChange({ target: { files: [file] } })
    })
  }
}