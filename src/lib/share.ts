// src/lib/share.ts
import { buildGameZipBlob } from '@/lib/export';
import type { GameSession, SavedRecording } from '@/types';
import { getBlob } from '@/lib/storage';

export async function prepareGameZipFile(
  game: GameSession | undefined,
  recs: SavedRecording[]
): Promise<File> {
  const { blob, filename } = await buildGameZipBlob(game, recs);
  return new File([blob], filename, { type: 'application/zip' });
}

export async function tryShareGame(
  game: GameSession | undefined,
  recs: SavedRecording[]
): Promise<boolean> {
  const file = await prepareGameZipFile(game, recs);
  return shareFile(file, 'Histura Game Export', 'Here is our Histura game export.');
}

/**
 * Share a single recording as a file using Web Share API.
 * Returns true if the share sheet opened with a file attached, false otherwise.
 */
export async function tryShareRecording(rec: SavedRecording, filename: string): Promise<boolean> {
  const blob = await getBlob(rec.blobKey);
  if (!blob) return false;

  const mime = rec.meta.mimeType || blob.type || 'application/octet-stream';
  const file = new File([blob], filename, { type: mime });

  return shareFile(file, 'Histura Recording', 'Histura recording attached.');
}

async function shareFile(file: File, title: string, text: string): Promise<boolean> {
  const navAny: any = typeof navigator !== 'undefined' ? navigator : null;
  if (!navAny || typeof navAny.share !== 'function') return false;

  // Prefer canShare when it exists, but DO NOT require it (iOS can be inconsistent)
  const canShareFn = typeof navAny.canShare === 'function' ? navAny.canShare.bind(navAny) : null;
  if (canShareFn) {
    try {
      const ok = canShareFn({ files: [file] });
      if (!ok) return false;
    } catch {
      // ignore and attempt share anyway
    }
  }

  // Attempt to share WITH file attached
  try {
    await navAny.share({ files: [file], title, text });
    return true;
  } catch {
    // Some implementations can fail when both files+text are present; retry files-only.
    try {
      await navAny.share({ files: [file], title });
      return true;
    } catch {
      return false;
    }
  }
}
