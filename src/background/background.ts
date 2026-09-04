import {
  loadFromPermanentDb,
  saveToPermanentDb,
} from '@src/shared/utils/storage/PermanentDb'

/**
 * Mirroring rewrites the whole IndexedDB store (clear + re-put), so firing it
 * on every storage write turns one saved answer into several full rewrites.
 * Coalesce bursts into a single trailing write instead.
 */
const MIRROR_DEBOUNCE_MS = 750
let mirrorTimer: ReturnType<typeof setTimeout> | null = null
let pending: { records: any[]; autoIncrement: number } | null = null

const scheduleMirror = (records: any[], autoIncrement: number) => {
  pending = { records, autoIncrement }
  if (mirrorTimer) clearTimeout(mirrorTimer)
  mirrorTimer = setTimeout(() => {
    mirrorTimer = null
    const next = pending
    pending = null
    if (next) {
      saveToPermanentDb(next.records, next.autoIncrement).catch(() => {})
    }
  }, MIRROR_DEBOUNCE_MS)
}

const recordsOf = (value: any): any[] =>
  Array.isArray(value?.store) ? value.store.map(([_, item]: any) => item) : []

// Verify storage integrity on install or update.
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const data = await chrome.storage.local.get([
      'answers1010',
      'answers1010_backup',
    ])

    // An empty store is a real state the user can reach by deleting their last
    // answer. Only step in when the key is absent or structurally broken.
    const primary = data.answers1010
    const isMissing =
      !primary || typeof primary !== 'object' || !Array.isArray(primary.store)

    if (!isMissing) {
      scheduleMirror(recordsOf(primary), primary.autoIncrement ?? 0)
      return
    }

    const backup = data.answers1010_backup
    if (backup && Array.isArray(backup.store)) {
      console.log('Background: restoring answers1010 from backup snapshot')
      await chrome.storage.local.set({ answers1010: backup })
      return
    }

    const idbData = await loadFromPermanentDb().catch(() => null)
    if (idbData && idbData.records?.length > 0) {
      console.log('Background: restoring answers1010 from IndexedDB')
      await chrome.storage.local.set({
        answers1010: {
          store: idbData.records.map((r: any) => [r.id, r]),
          autoIncrement: idbData.autoIncrement,
        },
      })
    }
  } catch (err) {
    console.warn('Background integrity check error:', err)
  }
})

// Keep IndexedDB in step with chrome.storage.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes.answers1010) return
  const newVal = changes.answers1010.newValue
  if (!newVal || !Array.isArray(newVal.store)) return
  const records = recordsOf(newVal)
  scheduleMirror(records, newVal.autoIncrement ?? records.length)
})
