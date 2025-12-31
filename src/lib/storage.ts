// src/lib/storage.ts
import { set, get, del } from 'idb-keyval';

type StoredMedia =
  | Blob
  | {
      __kind: 'arraybuffer-v1';
      mimeType: string;
      data: ArrayBuffer;
    };

export async function saveBlob(b: Blob): Promise<string> {
  const key = `rec-${crypto.randomUUID()}`;

  // iOS Safari: storing raw Blob in IndexedDB can be flaky for media.
  // Store ArrayBuffer + MIME type instead.
  const data = await b.arrayBuffer();
  const payload: StoredMedia = {
    __kind: 'arraybuffer-v1',
    mimeType: b.type || 'application/octet-stream',
    data,
  };

  await set(key, payload);
  return key;
}

export async function getBlob(key: string): Promise<Blob | null> {
  const v = (await get(key)) as StoredMedia | undefined;
  if (!v) return null;

  // Back-compat: older entries may be stored as Blob
  if (v instanceof Blob) return v;

  if (typeof v === 'object' && (v as any).__kind === 'arraybuffer-v1') {
    const p = v as Extract<StoredMedia, { __kind: 'arraybuffer-v1' }>;
    return new Blob([p.data], { type: p.mimeType || 'application/octet-stream' });
  }

  return null;
}

export async function deleteBlob(key: string): Promise<void> {
  try {
    await del(key);
  } catch {
    // ignore
  }
}
