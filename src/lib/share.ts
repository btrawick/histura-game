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

  const navAny: any = typeof navigator !== 'undefined' ? navigator : null;

  if (navAny && typeof navAny.share === 'function' && typeof navAny.canShare === 'function') {
    try {
      if (navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: 'Histura Game Export',
          text: 'Here is our Histura game recording export.',
        });
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Share a single recording as a file using Web Share API.
 * Returns true if the share sheet opened successfully, false otherwise.
 */
export async function tryShareRecording(
  rec: SavedRecording,
  filename: string
): Promise<boolean> {
  const blob = await getBlob(rec.blobKey);
  if (!blob) return false;

  const file = new File([blob], filename, {
    type: rec.meta.mimeType || blob.type || 'application/octet-stream',
  });

  const navAny: any = typeof navigator !== 'undefined' ? navigator : null;

  if (navAny && typeof navAny.share === 'function' && typeof navAny.canShare === 'function') {
    try {
      if (navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: 'Histura Recording',
          text: 'Sharing a Histura recording.',
        });
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
