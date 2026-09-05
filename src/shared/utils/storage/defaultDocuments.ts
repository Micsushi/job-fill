import { LocalStorageFile } from '../file'

/**
 * Documents that stand in for any file field with no answer of its own.
 *
 * Saving a resume against one job's "Resume/CV" field only helps on that
 * field. This is the upload-once store: attach it in the popup, and every
 * file field on every supported site falls back to it.
 */
const KEY = 'defaultDocuments'

export type DefaultDocuments = {
  resume?: LocalStorageFile
  coverLetter?: LocalStorageFile
}

export type DocumentKind = keyof DefaultDocuments

export const getDefaultDocuments = async (): Promise<DefaultDocuments> => {
  try {
    const stored = await chrome.storage.local.get(KEY)
    return stored[KEY] || {}
  } catch {
    return {}
  }
}

export const setDefaultDocument = async (
  kind: DocumentKind,
  file: LocalStorageFile | null
): Promise<void> => {
  const docs = await getDefaultDocuments()
  if (file) {
    docs[kind] = file
  } else {
    delete docs[kind]
  }
  await chrome.storage.local.set({ [KEY]: docs })
}

/**
 * Which document a field should fall back to, guessed from its label.
 * Anything that isn't clearly a cover letter is treated as a resume, since
 * that is what the overwhelming majority of file fields want.
 */
export const documentKindFor = (fieldName: string): DocumentKind => {
  return /cover\s*letter|lettre/i.test(fieldName || '') ? 'coverLetter' : 'resume'
}
