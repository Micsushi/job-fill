import { AnswerValueSingleFileUpload } from '../../../MoreInfoPopup/AnswerDisplay/AnswerValueDisplay/AnswerValueSingleFileUpload'
import { getElement } from '@src/shared/utils/getElements'
import { AnswerValueMethods } from '../baseFormInput'
import { GreenhouseBaseInput } from './GreenhouseBaseInput'
import { xpaths } from './xpaths'
import { fileToLocalStorage, LocalStorageFile, localStorageToFile } from '@src/shared/utils/file'
import { Answer } from '@src/shared/utils/types'
import fieldFillerQueue from '@src/shared/utils/fieldFillerQueue'
import { dispatchFileDragEvent } from '@src/shared/utils/fileUploadHelpers'
import { saveButtonClickHandlers } from '../../../hooks/saveButtonClickHandlers'


export class File extends GreenhouseBaseInput<any> {
  static XPATH = xpaths.SINGLE_FILE_UPLOAD
  fieldType = 'SingleFileUpload'
  public saveButtonClickHandler = saveButtonClickHandlers.fileAware
  fieldNotice =
    "To save and autofill a file, upload it in the 'Answers' section below."
  fieldNoticeLink = {
    display: 'See How',
    url: 'https://www.youtube.com/watch?v=JYMATq9siIY&t=134s',
  }
  get answerValue() {
    return {
      ...super.answerValue,
      displayComponent: AnswerValueSingleFileUpload,
    } as AnswerValueMethods
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
    const file = this.capturedFile || this.inputElement()?.files?.[0] || null
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

    const observer = new MutationObserver(() => {
      this.triggerReactUpdate()
    })

    const chosenFileDisplayElement = getElement(
      this.element,
      ".//div[@class='chosen']"
    )

    observer.observe(chosenFileDisplayElement, {
      attributes: true,
      attributeFilter: ['style'],
    })
  }

  inputElement(): HTMLInputElement {
    return
  }

  inputDisplayElement(): HTMLElement {
    return getElement(
      this.element,
      ".//div[contains(@class, 'attach-or-paste')]"
    )
  }

  public isFilled(current: any, stored: LocalStorageFile[]): boolean {
    return current === stored[0].name
  }

  get deleteButtonElement(): HTMLElement {
    return getElement(
      this.element,
      ".//button[@aria-label='Remove attachment']"
    )
  }

  get dropZoneElement(): HTMLElement {
    return getElement(this.element, ".//div[contains(@class, 'drop-zone')]")
  }

  currentValue() {
    const XPATH = [
      ".//div[@class='chosen']",
      "//span[contains(@id, '_filename')]",
    ].join('')
    return getElement(this.element, XPATH)?.innerText || ''
  }
  async fill(): Promise<void> {
    await fieldFillerQueue.enqueue(async () => {
      const answer = (await this.answer()) || []
      if (answer.length > 0 && answer[0].answer) {
        const file = localStorageToFile(answer[0].answer)
        this.deleteButtonElement?.click()
        dispatchFileDragEvent('drop', this.dropZoneElement, [file])
      }
    })
  }
}
