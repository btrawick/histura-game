import { set, get, del, keys } from 'idb-keyval'
import JSZip from 'jszip'
import { SavedRecording } from '@/types'

export async function saveBlob(blob: Blob): Promise<string> {
  const key = `rec-${crypto.randomUUID()}`
  await set(key, blob)
  return key
}

export async function loadBlob(key: string): Promise<Blob | undefined> {
  return get<Blob>(key)
}

export async function deleteBlob(key: string): Promise<void> {
  await del(key)
}

export async function exportAll(recordings: SavedRecording[]): Promise<Blob> {
  const zip = new JSZip()
  const metaFolder = zip.folder('metadata')!
  for (const rec of recordings) {
    const blob = await loadBlob(rec.blobKey)
    if (!blob) continue
    const ext = blob.type.includes('video') ? 'webm' : 'webm'
    zip.file(`${rec.meta.id}.${ext}`, blob)
    metaFolder.file(`${rec.meta.id}.json`, JSON.stringify(rec.meta, null, 2))
  }
  return zip.generateAsync({ type: 'blob' })
}

export async function listAllBlobKeys(): Promise<string[]> {
  const ks = await keys()
  return ks.filter((k) => typeof k === 'string' && (k as string).startsWith('rec-')) as string[]
}
