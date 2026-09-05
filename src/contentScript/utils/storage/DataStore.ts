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
  const answer1010: any = { answer: answer106.answer, ...path }
  if (answer106.confirmWithEnter !== undefined) {
    answer1010.confirmWithEnter = answer106.confirmWithEnter
  }
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
  const { section, fieldType, fieldName, answer, id, matchType, confirmWithEnter } =
    answer1010 as SavedAnswer
  return {
    answer,
    id,
    matchType,
    confirmWithEnter,
    path: { section, fieldName, fieldType },
  }
}

/**
 * Bump when a new one-off repair is added, so it runs once for existing users.
 */
const MAINTENANCE_VERSION = 2

/**
 * How many actions can be taken back. Entries hold only the records an action
 * touched, not a copy of the whole store, so a long history stays cheap --
 * except for file answers, which are base64 and are kept in memory only.
 */
const MAX_HISTORY = 20
const MAX_PERSISTED_ENTRY_BYTES = 100_000

export type HistoryEntry = {
  label: string
  /** Records as they were. Restored on undo. */
  before: SavedAnswer[]
  /** Records as they are now. Restored on redo. */
  after: SavedAnswer[]
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

/**
 * Words that carry no identifying signal in a form label. Dropped before
 * comparing, so a long question is judged on its distinctive words rather
 * than on the grammar around them.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'for', 'to', 'in', 'on', 'at', 'as', 'by', 'is',
  'are', 'was', 'do', 'does', 'did', 'you', 'your', 'we', 'us', 'our', 'will',
  'would', 'can', 'may', 'if', 'or', 'and', 'be', 'been', 'it', 'this', 'that',
  'with', 'which', 'where', 'who', 'whom', 'what', 'when', 'have', 'has',
  'any', 'all', 'please', 'select', 'choose', 'enter', 'provide', 'now',
  'not', 'my', 'me', 'i', 'am', 'from', 'about', 'there', 'their',
])

const fieldTokens = (value: string): Set<string> => {
  const tokens = normalizeFieldName(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOPWORDS.has(token))
  return new Set(tokens)
}

/**
 * Fraction of distinctive words the two names share, measured against the
 * longer of the two.
 *
 * Measuring against the longer name is the point. "Country" appears inside
 * "Do you now, or will you in the future, require sponsorship for an
 * employment visa in the country where the position is located?", and a
 * one-sided containment check would call that a match -- which is how a
 * country dropdown ended up being offered a yes/no sponsorship answer.
 */
const tokenSymmetry = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0
  let shared = 0
  a.forEach((token) => {
    if (b.has(token)) shared++
  })
  return shared / Math.max(a.size, b.size)
}

/**
 * Two names must be substantially the same set of words, not merely
 * overlapping. 0.5 keeps "Email" / "Email Address" and "Phone" /
 * "Phone Number" while rejecting a short label against a long question.
 */
const MIN_TOKEN_SYMMETRY = 0.5

export function areFieldNamesCompatible(
  query: string,
  candidate: string
): boolean {
  const q = normalizeFieldName(query)
  const c = normalizeFieldName(candidate)

  if (!q || !c) return false
  if (q === c) return true

  // Scope check before the topical rules below. Without it a fuzzy index hit
  // on a single shared word is enough to pair unrelated questions.
  if (tokenSymmetry(fieldTokens(q), fieldTokens(c)) < MIN_TOKEN_SYMMETRY) {
    return false
  }

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
  /** Set while a compound action records a single entry of its own. */
  private suspendHistory = false
  private past: HistoryEntry[] = []
  private future: HistoryEntry[] = []

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
    const savedAnswer = { ...item, id } as SavedAnswer
    this.store.set(id, savedAnswer) // Store the item with the new ID
    this.exactMatchIndex.add(item.fieldName, id)
    this.ts_index.addDoc({ fieldName: item.fieldName, id })
    if (!this.suspendHistory) {
      this.record(`Save "${item.fieldName}"`, [], [savedAnswer])
    }
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
      if (!this.suspendHistory) {
        this.record(`Delete "${record.fieldName}"`, [record], [])
      }
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
    // delete() and add() each record their own entry; an edit is one action.
    const outer = this.suspendHistory
    this.suspendHistory = true
    if (old) {
      this.delete(old.id)
    }
    this.add(item, item.id)
    this.suspendHistory = outer
    if (!this.suspendHistory) {
      this.record(`Edit "${item.fieldName}"`, old ? [old] : [], [item])
    }
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

    await this.loadHistory()
    await this.runMaintenanceIfNeeded()
  }

  /**
   * Repairs that must happen once per store, not once per click.
   *
   * Older versions keyed answers on the job posting title, so stores built by
   * them carry duplicates. Running this on load means a user only has to
   * reload to get a clean store, rather than knowing to press a button.
   */
  private async runMaintenanceIfNeeded(): Promise<void> {
    const key = `${this.name}_maintenanceVersion`
    try {
      const stored = await chrome.storage.local.get(key)
      if ((stored[key] || 0) >= MAINTENANCE_VERSION) return

      const { duplicatesRemoved, recordsRepaired } = await this.cleanUp()
      await chrome.storage.local.set({ [key]: MAINTENANCE_VERSION })

      if (duplicatesRemoved || recordsRepaired) {
        console.info(
          `Job Fill: tidied saved answers (${duplicatesRemoved} duplicate(s) removed, ${recordsRepaired} repaired).`
        )
      }
    } catch (err) {
      // Never block loading over a tidy-up.
      console.warn('Job Fill: maintenance skipped', err)
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
    const importBefore = this.getAll().map((r) => structuredClone(r))
    const outerSuspend = this.suspendHistory
    this.suspendHistory = true

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

    this.suspendHistory = outerSuspend
    if (!this.suspendHistory) {
      this.record(
        `Import ${added + updated} answer(s)`,
        importBefore,
        this.getAll().map((r) => structuredClone(r))
      )
    }

    await this.persist()
    return { added, updated, total: this.store.size }
  }



  /**
   * Repair records left behind by older versions.
   *
   * Answers used to be keyed on `page`, the job posting title, so saving the
   * same answer on a second posting stored a second copy rather than matching
   * the first. That is why a field can show the same value listed twice.
   *
   * Removes exact duplicates (same normalised question, section, type and
   * value) keeping the earliest, and strips the stale `page` key so what
   * remains matches across postings.
   */
  async cleanUp(): Promise<{
    duplicatesRemoved: number
    recordsRepaired: number
    total: number
  }> {
    // Undoable: cleanUp records one history entry for everything it removes.
    if (!this.loaded) {
      await this.load()
    }

    const seen = new Set<string>()
    const duplicates: number[] = []
    let recordsRepaired = 0

    // An answer with no value fills nothing, and competes with real answers
    // for the same question. It is dead weight, not a preference.
    const isBlank = (value: any) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && value.filter((v) => String(v ?? '').trim()).length === 0)

    for (const record of this.getAll()) {
      const loose = record as any
      if ('page' in loose) {
        delete loose.page
        recordsRepaired++
      }

      const key = [
        normalizeFieldName(loose.fieldName || ''),
        loose.section || '',
        loose.fieldType || '',
        JSON.stringify(loose.answer ?? null),
      ].join(String.fromCharCode(0))

      if (isBlank(loose.answer) || seen.has(key)) {
        duplicates.push(loose.id)
      } else {
        seen.add(key)
      }
    }

    // Remove directly rather than through delete(), which persists each time.
    const removed: SavedAnswer[] = []
    duplicates.forEach((id) => {
      const record = this.store.get(id)
      if (!record) return
      removed.push(structuredClone(record))
      this.exactMatchIndex.delete(record.fieldName, id)
      this.ts_index.removeDoc({ fieldName: record.fieldName, id })
      this.store.delete(id)
    })

    if (removed.length && !this.suspendHistory) {
      this.record(`Tidy up ${removed.length} answer(s)`, removed, [])
    }

    await this.persist()
    return {
      duplicatesRemoved: duplicates.length,
      recordsRepaired,
      total: this.store.size,
    }
  }


  // ---------------------------------------------------------------- history

  /**
   * Record an action so it can be taken back.
   *
   * Stores the affected records either side of the change rather than a
   * snapshot of everything, so undo stays cheap on a large store.
   */
  private record(label: string, before: SavedAnswer[], after: SavedAnswer[]) {
    this.past.push({
      label,
      before: structuredClone(before),
      after: structuredClone(after),
    })
    if (this.past.length > MAX_HISTORY) this.past.shift()
    // A new action invalidates anything that was undone.
    this.future = []
    this.persistHistory()
  }

  private putRecord(record: SavedAnswer) {
    this.store.set(record.id, record)
    this.exactMatchIndex.add(record.fieldName, record.id)
    this.ts_index.addDoc({ fieldName: record.fieldName, id: record.id })
    this.autoIncrement = Math.max(this.autoIncrement, record.id + 1)
  }

  private dropRecord(id: number) {
    const record = this.store.get(id)
    if (!record) return
    this.exactMatchIndex.delete(record.fieldName, id)
    this.ts_index.removeDoc({ fieldName: record.fieldName, id })
    this.store.delete(id)
  }

  /** Remove what the action produced, put back what it replaced. */
  private applyRecords(remove: SavedAnswer[], restore: SavedAnswer[]) {
    const restored = new Set(restore.map((r) => r.id))
    remove.forEach((r) => {
      if (!restored.has(r.id)) this.dropRecord(r.id)
    })
    restore.forEach((r) => this.putRecord(structuredClone(r)))
  }

  canUndo(): boolean {
    return this.past.length > 0
  }

  /** What undo would take back, for labelling the control. */
  nextUndoLabel(): string | null {
    return this.past.length ? this.past[this.past.length - 1].label : null
  }

  nextRedoLabel(): string | null {
    return this.future.length ? this.future[this.future.length - 1].label : null
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  /** Returns the label of what was undone, or null if there was nothing. */
  async undo(): Promise<string | null> {
    const entry = this.past.pop()
    if (!entry) return null
    this.applyRecords(entry.after, entry.before)
    this.future.push(entry)
    await this.persist()
    await this.persistHistory()
    return entry.label
  }

  async redo(): Promise<string | null> {
    const entry = this.future.pop()
    if (!entry) return null
    this.applyRecords(entry.before, entry.after)
    this.past.push(entry)
    await this.persist()
    await this.persistHistory()
    return entry.label
  }

  /**
   * History lives in storage so an action taken on a job page can be undone
   * from the popup, which is a separate context with its own instance.
   */
  private async persistHistory(): Promise<void> {
    try {
      const trim = (entries: HistoryEntry[]) =>
        entries.filter(
          (e) => JSON.stringify(e).length <= MAX_PERSISTED_ENTRY_BYTES
        )
      await chrome.storage.local.set({
        [`${this.name}_history`]: {
          past: trim(this.past),
          future: trim(this.future),
        },
      })
    } catch {
      // History is a convenience; never fail an action over it.
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const key = `${this.name}_history`
      const stored = await chrome.storage.local.get(key)
      this.past = stored[key]?.past || []
      this.future = stored[key]?.future || []
    } catch {
      this.past = []
      this.future = []
    }
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
        return {
          ...this.get(parseInt(ref)),
          matchType: `Similar: ${score.toFixed(2)}`,
        }
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
