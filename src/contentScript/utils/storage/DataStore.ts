import elasticlunr from 'elasticlunr'
import { NewAnswer, SavedAnswer } from './DataStoreTypes'
import { Answer, FieldPath } from '@src/shared/utils/types'
import {
  saveToPermanentDb,
  loadFromPermanentDb,
} from '@src/shared/utils/storage/PermanentDb'

export const convert106To1010 = (
  answer106: Answer
): NewAnswer | SavedAnswer => {
  // `page` is the job posting title. Keeping it would make every answer
  // posting-specific: the same value saved on a second job would be stored
  // again instead of matching, and the store would grow without bound.
  const { page, ...path } = answer106.path || ({} as any)
  const answer1010 = { answer: answer106.answer, ...path }
  const { matchType, id } = answer106
  if (id !== undefined) {
    ;(answer1010 as SavedAnswer).id = id
  }
  if (matchType !== undefined) {
    ;(answer1010 as SavedAnswer).matchType = matchType
  }
  return answer1010
}

export const convert1010To106 = (
  answer1010: NewAnswer | SavedAnswer
): Answer => {
  const { section, fieldType, fieldName, answer, id, matchType } =
    answer1010 as SavedAnswer
  return { answer, id, matchType, path: { section, fieldName, fieldType } }
}

const tsIndex = () => {
  const index = elasticlunr<{ fieldName: string; id: number }>()
    .addField('fieldName')
    .addField('id')
  return index
}

export const normalizeFieldName = (name: string): string => {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[\*✱]/g, '')
    .replace(/\s*\((required|optional)\)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function areFieldNamesCompatible(
  query: string,
  candidate: string
): boolean {
  const q = normalizeFieldName(query)
  const c = normalizeFieldName(candidate)

  if (!q || !c) return false
  if (q === c) return true

  // Middle name vs first/last/full name
  const qHasMiddle = /\b(middle)\b/.test(q)
  const cHasMiddle = /\b(middle)\b/.test(c)
  if (qHasMiddle !== cHasMiddle) return false

  // Email vs non-email
  const qHasEmail = /\b(email|e-mail)\b/.test(q)
  const cHasEmail = /\b(email|e-mail)\b/.test(c)
  if (qHasEmail !== cHasEmail) return false

  // First name vs Last name
  const qHasFirst = /\b(first|given|forename)\b/.test(q)
  const cHasFirst = /\b(first|given|forename)\b/.test(c)
  const qHasLast = /\b(last|family|surname)\b/.test(q)
  const cHasLast = /\b(last|family|surname)\b/.test(c)
  if (qHasFirst && cHasLast) return false
  if (qHasLast && cHasFirst) return false

  // Address lines: line 1 vs line 2 vs line 3 / apt / suite
  const qIsLine2 =
    /\b(line\s*2|address\s*2|apt|suite|unit|bldg|building|floor)\b/.test(q)
  const cIsLine2 =
    /\b(line\s*2|address\s*2|apt|suite|unit|bldg|building|floor)\b/.test(c)
  if (qIsLine2 !== cIsLine2) return false

  const qIsLine1 =
    /\b(line\s*1|address\s*1|street\s*address)\b/.test(q) && !qIsLine2
  const cIsLine1 =
    /\b(line\s*1|address\s*1|street\s*address)\b/.test(c) && !cIsLine2
  if (qIsLine1 && cIsLine2) return false
  if (qIsLine2 && cIsLine1) return false

  // Company vs personal name
  const qHasCompany = /\b(company|employer|organization|org)\b/.test(q)
  const cHasCompany = /\b(company|employer|organization|org)\b/.test(c)
  if (qHasCompany !== cHasCompany) return false

  // School vs other
  const qHasSchool =
    /\b(school|university|college|institution|bootcamp)\b/.test(q)
  const cHasSchool =
    /\b(school|university|college|institution|bootcamp)\b/.test(c)
  if (qHasSchool !== cHasSchool) return false

  // Start vs End dates
  const qHasStart = /\b(start|from)\b/.test(q)
  const cHasStart = /\b(start|from)\b/.test(c)
  const qHasEnd = /\b(end|to|graduation)\b/.test(q)
  const cHasEnd = /\b(end|to|graduation)\b/.test(c)
  if (qHasStart && cHasEnd) return false
  if (qHasEnd && cHasStart) return false

  // Month vs Year
  const qHasMonth = /\b(month)\b/.test(q)
  const cHasMonth = /\b(month)\b/.test(c)
  const qHasYear = /\b(year)\b/.test(q)
  const cHasYear = /\b(year)\b/.test(c)
  if (qHasMonth && cHasYear) return false
  if (qHasYear && cHasMonth) return false

  return true
}

/**
 * Imported files are hand editable, so nothing about their shape is
 * guaranteed. Drop anything that can't be stored safely rather than letting
 * it into the store, where the fill logic would dereference it later.
 */
export function sanitizeImportedRecord(raw: any): NewAnswer | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.fieldName !== 'string' || !raw.fieldName.trim()) return null
  if (!('answer' in raw)) return null

  return {
    fieldName: raw.fieldName,
    answer: raw.answer,
    section: typeof raw.section === 'string' ? raw.section : '',
    fieldType: typeof raw.fieldType === 'string' ? raw.fieldType : 'TextInput',
  } as NewAnswer
}

class ExactMatchIndex {
  store: { [key: string]: number[] }
  constructor() {
    this.store = {}
  }
  add(key: string, id: number) {
    const rawKey = key || ''
    const normKey = normalizeFieldName(rawKey)
    for (const k of [rawKey, normKey]) {
      if (!k) continue
      const ids = this.store[k] || []
      if (!ids.includes(id)) {
        ids.push(id)
      }
      this.store[k] = ids
    }
  }

  delete(key: string, id: number) {
    const rawKey = key || ''
    const normKey = normalizeFieldName(rawKey)
    for (const k of [rawKey, normKey]) {
      if (!k) continue
      let ids = this.store[k] || []
      ids = ids.filter((i) => i !== id)
      if (ids.length === 0) {
        delete this.store[k]
      } else {
        this.store[k] = ids
      }
    }
  }

  get(key: string): number[] {
    const rawKey = key || ''
    const normKey = normalizeFieldName(rawKey)
    const rawMatches = this.store[rawKey] || []
    const normMatches = this.store[normKey] || []
    const combined = [...rawMatches]
    for (const id of normMatches) {
      if (!combined.includes(id)) {
        combined.push(id)
      }
    }
    return combined
  }
}

export class DataStore {
  store: Map<number, SavedAnswer>
  autoIncrement: number
  name: string
  loaded: boolean
  exactMatchIndex: ExactMatchIndex
  ts_index: elasticlunr.Index<{
    fieldName: string
    id: number
  }>

  listenerAttached: boolean

  constructor(name: string) {
    this.name = name
    this.store = new Map()
    this.autoIncrement = 0 // Auto-incrementing ID counter
    this.exactMatchIndex = new ExactMatchIndex()
    this.ts_index = tsIndex()
    this.loaded = false
    this.listenerAttached = false
  }
  // BUT WHAT ABOUT DATE VALUES AND ARRAY VALUES.
  findExisting(newAnswer: NewAnswer): SavedAnswer | null {
    return this.exactSearch(newAnswer.fieldName).find((savedAnswer) => {
      return Object.entries(newAnswer).every(([key, value]) => {
        return JSON.stringify(savedAnswer[key]) === JSON.stringify(value)
      })
    })
  }

  // Method to add a new item, auto-generating an ID
  add(item: NewAnswer, id: number = null): SavedAnswer {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    if (id === null || id === undefined) {
      id = this.autoIncrement++
    } else {
      this.autoIncrement = Math.max(this.autoIncrement, id + 1)
    }
    const existingMatch = this.findExisting(item)
    if (existingMatch) {
      return existingMatch
    }
    const savedAnswer = { ...item, id }
    this.store.set(id, savedAnswer) // Store the item with the new ID
    this.exactMatchIndex.add(item.fieldName, id)
    this.ts_index.addDoc({ fieldName: item.fieldName, id })
    this.persist() // Persist the data to chrome.storage.local
    return savedAnswer // Return the assigned ID
  }

  // Method to retrieve an item by ID
  get(id: number): SavedAnswer {
    return this.store.get(id)
  }

  // Method to remove an item by ID
  delete(id: number) {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    const record = this.store.get(id)
    if (record) {
      this.exactMatchIndex.delete(record.fieldName, id)
      this.ts_index.removeDoc({ fieldName: record.fieldName, id })
      this.store.delete(id)
      this.persist()
      return true
    }
    return false
  }

  update(item: SavedAnswer): SavedAnswer {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    const old = this.get(item.id)
    if (old) {
      this.delete(old.id)
    }
    this.add(item, item.id)
    return item
  }

  // Method to retrieve all items
  getAll() {
    return Array.from(this.store.values())
  }

  // Persist the store and current ID to chrome.storage.local + secondary backup + IndexedDB
  async persist() {
    if (!this.loaded) {
      throw new Error('load it first')
    }
    const data = {
      store: Array.from(this.store.entries()), // Convert Map to array for storage
      autoIncrement: this.autoIncrement,
    }
    await chrome.storage.local.set({ [this.name]: data })

    // Mirror unconditionally, empty store included. Skipping the write when
    // the store is empty makes deletions un-stick: the stale backup outlives
    // them and gets restored on the next load.
    await chrome.storage.local.set({
      [`${this.name}_backup`]: {
        ...data,
        updatedAt: new Date().toISOString(),
        recordCount: this.store.size,
      },
    })
    saveToPermanentDb(this.getAll(), this.autoIncrement).catch(() => {})
  }

  // Load the store and current ID from chrome.storage.local with automatic recovery
  async load() {
    const backupKey = `${this.name}_backup`
    const result = await chrome.storage.local.get([this.name, backupKey])
    let storeData = result[this.name]

    // Recover only when the key is absent or unreadable. An empty store is a
    // legitimate state -- the user deleted their last answer -- and restoring
    // over it would silently undo the deletion.
    const isMissing =
      !storeData || typeof storeData !== 'object' || !Array.isArray(storeData.store)
    if (isMissing) {
      if (
        result[backupKey] &&
        result[backupKey].store &&
        result[backupKey].store.length > 0
      ) {
        console.info('Auto-recovering DataStore from secondary backup...')
        storeData = result[backupKey]
        await chrome.storage.local.set({ [this.name]: storeData })
      } else {
        // Try IndexedDB permanent storage
        const idbData = await loadFromPermanentDb().catch(() => null)
        if (idbData && idbData.records && idbData.records.length > 0) {
          console.info('Auto-recovering DataStore from IndexedDB permanent store...')
          const entries: [number, SavedAnswer][] = idbData.records.map(
            (r: SavedAnswer) => [r.id, r]
          )
          storeData = { store: entries, autoIncrement: idbData.autoIncrement }
          await chrome.storage.local.set({ [this.name]: storeData })
        }
      }
    }

    this.store = new Map()
    this.exactMatchIndex = new ExactMatchIndex()
    this.ts_index = tsIndex()

    if (storeData && storeData.store) {
      const { store, autoIncrement } = storeData
      this.store = new Map(store)
      this.autoIncrement = autoIncrement || 0
      store.forEach(([id, { fieldName }]: [number, SavedAnswer]) => {
        this.exactMatchIndex.add(fieldName, id)
        this.ts_index.addDoc({ fieldName, id })
      })
      saveToPermanentDb(this.getAll(), this.autoIncrement).catch(() => {})
    }
    this.loaded = true

    if (
      !this.listenerAttached &&
      typeof chrome !== 'undefined' &&
      chrome.storage?.onChanged
    ) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[this.name]) {
          const newStoreData = changes[this.name].newValue
          if (newStoreData && newStoreData.store) {
            this.store = new Map(newStoreData.store)
            this.autoIncrement =
              newStoreData.autoIncrement || this.autoIncrement
            this.exactMatchIndex = new ExactMatchIndex()
            this.ts_index = tsIndex()
            newStoreData.store.forEach(
              ([id, { fieldName }]: [number, SavedAnswer]) => {
                this.exactMatchIndex.add(fieldName, id)
                this.ts_index.addDoc({ fieldName, id })
              }
            )
          }
        }
      })
      this.listenerAttached = true
    }
  }

  exportDb() {
    return {
      version: 1,
      format: 'job_app_filler_db',
      exportedAt: new Date().toISOString(),
      totalRecords: this.store.size,
      autoIncrement: this.autoIncrement,
      records: this.getAll(),
      raw: {
        store: Array.from(this.store.entries()),
        autoIncrement: this.autoIncrement,
      },
    }
  }

  async importDb(
    importedData: any,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{ added: number; updated: number; total: number }> {
    if (!this.loaded) {
      await this.load()
    }

    let recordsToImport: SavedAnswer[] = []
    let maxId = this.autoIncrement

    if (Array.isArray(importedData?.records)) {
      recordsToImport = importedData.records
      if (typeof importedData.autoIncrement === 'number') {
        maxId = Math.max(maxId, importedData.autoIncrement)
      }
    } else if (importedData?.answers1010?.store) {
      recordsToImport = importedData.answers1010.store.map(
        ([_, item]: any) => item
      )
      maxId = Math.max(maxId, importedData.answers1010.autoIncrement || 0)
    } else if (importedData?.store) {
      recordsToImport = importedData.store.map(([_, item]: any) => item)
      maxId = Math.max(maxId, importedData.autoIncrement || 0)
    }

    if (mode === 'replace') {
      this.store.clear()
      this.exactMatchIndex = new ExactMatchIndex()
      this.ts_index = tsIndex()
      this.autoIncrement = 0
    }

    let added = 0
    let updated = 0

    for (const raw of recordsToImport) {
      const record = sanitizeImportedRecord(raw)
      if (!record) continue
      const existing = this.findExisting(record)
      if (existing) {
        this.update({ ...record, id: existing.id })
        updated++
      } else {
        this.add(record)
        added++
      }
    }

    if (mode === 'replace') {
      this.autoIncrement = Math.max(this.autoIncrement, maxId)
    }

    await this.persist()
    return { added, updated, total: this.store.size }
  }


  exactSearch(fieldName: string): SavedAnswer[] {
    const matchingIds = this.exactMatchIndex.get(fieldName)
    return matchingIds.map((id: number) => {
      return { ...this.get(id), matchType: 'exact' }
    })
  }

  tsSearch(fieldName: string): SavedAnswer[] {
    const results = this.ts_index.search(fieldName, {})
    return results
      .filter(({ ref, score }) => {
        const item = this.get(parseInt(ref))
        if (!item || score < 0.2) return false
        return areFieldNamesCompatible(fieldName, item.fieldName)
      })
      .map(({ ref, score }) => {
        return { ...this.get(parseInt(ref)), matchType: `Similar: ${score}` }
      })
  }

  pushResults(results: SavedAnswer[], matches: SavedAnswer[]) {
    const currentIds = results.map(({ id }) => id)
    matches.forEach((match) => {
      if (!currentIds.includes(match.id)) {
        results.push(match)
      }
    })
  }

  search({ fieldName, section, fieldType }: FieldPath): SavedAnswer[] {
    const limit = 10
    // get matches
    const exactMatches = this.exactSearch(fieldName)
    const tsMatches = this.tsSearch(fieldName)
    // combine matches
    const results = []
    this.pushResults(results, exactMatches)
    this.pushResults(results, tsMatches)
    // filter matches
    const filteredResults = results.filter((answer: SavedAnswer) => {
      return answer.fieldType === fieldType && answer.section === section
    })
    return filteredResults.slice(0, limit)
  }
}
