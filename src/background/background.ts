import {
  loadFromPermanentDb,
  saveToPermanentDb,
} from '@src/shared/utils/storage/PermanentDb'

// Listen for extension install or update to verify and protect storage integrity
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const data = await chrome.storage.local.get([
      'answers1010',
      'answers1010_backup',
    ])
    if (
      !data.answers1010 ||
      !data.answers1010.store ||
      data.answers1010.store.length === 0
    ) {
      if (data.answers1010_backup?.store?.length > 0) {
        console.log(
          'Background: Restoring answers1010 from backup snapshot...'
        )
        await chrome.storage.local.set({ answers1010: data.answers1010_backup })
      } else {
        const idbData = await loadFromPermanentDb().catch(() => null)
        if (idbData && idbData.records?.length > 0) {
          console.log('Background: Restoring answers1010 from IndexedDB...')
          const entries = idbData.records.map((r: any) => [r.id, r])
          await chrome.storage.local.set({
            answers1010: {
              store: entries,
              autoIncrement: idbData.autoIncrement,
            },
          })
        }
      }
    } else {
      // Keep IndexedDB synchronized with current storage
      const records = data.answers1010.store.map(([_, item]: any) => item)
      saveToPermanentDb(
        records,
        data.answers1010.autoIncrement || records.length
      ).catch(() => {})
    }
  } catch (err) {
    console.warn('Background integrity check error:', err)
  }
})

// Mirror storage changes to permanent IndexedDB
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.answers1010) {
    const newVal = changes.answers1010.newValue
    if (newVal?.store) {
      const records = newVal.store.map(([_, item]: any) => item)
      saveToPermanentDb(
        records,
        newVal.autoIncrement || records.length
      ).catch(() => {})
    }
  }
})