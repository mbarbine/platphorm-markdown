"use client"

const DB_NAME = "markdowntree-local-drafts"
const DB_VERSION = 1
const STORE_NAME = "drafts"
const DEFAULT_ID = "default"

export interface LocalDraftRecord {
  id: string
  title: string
  content: string
  storageMode: "indexeddb"
  syncStatus: "local_only"
  updatedAt: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveDefaultDraft(content: string): Promise<LocalDraftRecord> {
  const db = await openDb()
  const record: LocalDraftRecord = {
    id: DEFAULT_ID,
    title: content.match(/^#\s+(.+)$/m)?.[1] ?? "Untitled Markdown draft",
    content,
    storageMode: "indexeddb",
    syncStatus: "local_only",
    updatedAt: new Date().toISOString(),
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
  return record
}

export async function loadDefaultDraft(): Promise<LocalDraftRecord | null> {
  const db = await openDb()
  const record = await new Promise<LocalDraftRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).get(DEFAULT_ID)
    request.onsuccess = () => resolve((request.result as LocalDraftRecord | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return record
}
