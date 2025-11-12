// src/lib/share.ts
import { exportGameZipBuildBlob } from '@/lib/export';
import type { GameSession, SavedRecording } from '@/types';

export function canWebShareFiles() {
  return typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator;
}

export async function shareGameZip(game: GameSession, recs: SavedRecording[]) {
  // Build the ZIP as a Blob (reuse your export code path)
  const { blob, filename } = await exportGameZipBuildBlob(game, recs);

  const file = new File([blob], filename, { type: 'application/zip' });
  const payload: ShareData = {
    title: filename.replace(/\.zip$/, ''),
    text: `Game: ${game.p1Name} vs ${game.p2Name}`,
    files: [file],
  };

  // If full file share is supported, use it; otherwise throw so caller can fallback
  if ((navigator as any).canShare?.({ files: [file] })) {
    await (navigator as any).share(payload);
    return true;
  }
  return false;
}
