// src/lib/storage.ts
import { set, get, del } from 'idb-keyval';

export async function saveBlob(b: Blob): Promise<string> {
  const key = `rec-${crypto.randomUUID()}`;
  await set(key, b);
  return key;
}

export async function getBlob(key: string): Promise<Blob | null> {
  const b = await get(key);
  return (b as Blob) ?? null;
}

export async function deleteBlob(key: string): Promise<void> {
  try {
    await del(key);
  } catch {
    // ignore if already gone
  }
}
