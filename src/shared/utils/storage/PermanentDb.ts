// Deliberately not renamed along with the product. This is a storage key:
// changing it orphans every mirrored record already on disk.
const DB_NAME = 'JobAppFillerPermanentDB'
const DB_VERSION = 1
const ANSWERS_STORE = 'answers'
const META_STORE = 'meta'

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = (event) => {
        const db = request.result
        if (!db.objectStoreNames.contains(ANSWERS_STORE)) {
          const store = db.createObjectStore(ANSWERS_STORE, { keyPath: 'id' })
          store.createIndex('fieldName', 'fieldName', { unique: false })
          store.createIndex('section', 'section', { unique: false })
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'key' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.warn('PermanentDB open failed:', request.error)
        resolve(null)
      }
    } catch (e) {
      console.warn('PermanentDB initialization error:', e)
      resolve(null)
    }
  })
}

export async function saveToPermanentDb(
  records: any[],
  autoIncrement: number
): Promise<boolean> {
  const db = await openDatabase()
  if (!db) return false

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([ANSWERS_STORE, META_STORE], 'readwrite')
      const answersStore = tx.objectStore(ANSWERS_STORE)
      const metaStore = tx.objectStore(META_STORE)

      answersStore.clear()
      for (const record of records) {
        answersStore.put(record)
      }

      metaStore.put({
        key: 'state',
        autoIncrement,
        totalRecords: records.length,
        savedAt: new Date().toISOString(),
      })

      tx.oncomplete = () => {
        db.close()
        resolve(true)
      }
      tx.onerror = () => {
        console.warn('PermanentDB save transaction error:', tx.error)
        db.close()
        resolve(false)
      }
    } catch (e) {
      console.warn('PermanentDB save error:', e)
      db.close()
      resolve(false)
    }
  })
}

export async function loadFromPermanentDb(): Promise<{
  records: any[]
  autoIncrement: number
} | null> {
  const db = await openDatabase()
  if (!db) return null

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([ANSWERS_STORE, META_STORE], 'readonly')
      const answersStore = tx.objectStore(ANSWERS_STORE)
      const metaStore = tx.objectStore(META_STORE)

      const getAllRequest = answersStore.getAll()
      const getMetaRequest = metaStore.get('state')

      tx.oncomplete = () => {
        const records = getAllRequest.result || []
        const meta = getMetaRequest.result || {}
        db.close()
        if (records.length > 0) {
          resolve({
            records,
            autoIncrement: meta.autoIncrement || records.length,
          })
        } else {
          resolve(null)
        }
      }

      tx.onerror = () => {
        console.warn('PermanentDB load transaction error:', tx.error)
        db.close()
        resolve(null)
      }
    } catch (e) {
      console.warn('PermanentDB load error:', e)
      db.close()
      resolve(null)
    }
  })
}
