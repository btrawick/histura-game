// src/lib/share.ts
import { buildGameZipBlob } from '@/lib/export';
import type { GameSession, SavedRecording } from '@/types';

/**
 * Prepare a ZIP file representing a game and return a File object.
 * Used for integrating with APIs that accept File objects.
 */
export async function prepareGameZipFile(
  game: GameSession | undefined,
  recs: SavedRecording[]
): Promise<File> {
  const { blob, filename } = await buildGameZipBlob(game, recs);
  return new File([blob], filename, {
    type: 'application/zip'
  });
}

/**
 * Share a game using Web Share API (if supported).
 * Returns true if the share sheet opened successfully, false otherwise.
 */
export async function tryShareGame(
  game: GameSession | undefined,
  recs: SavedRecording[]
): Promise<boolean> {
  const file = await prepareGameZipFile(game, recs);

  const navAny: any =
    typeof navigator !== 'undefined' ? navigator : null;

  if (
    navAny &&
    typeof navAny.share === 'function' &&
    typeof navAny.canShare === 'function'
  ) {
    try {
      if (navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: 'Histura Game Export',
          text: 'Here is our Histura game recording export.'
        });
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}
