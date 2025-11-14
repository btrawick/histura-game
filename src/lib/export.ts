// src/lib/export.ts
import JSZip from 'jszip';
import type { GameSession, SavedRecording } from '@/types';
import { getBlob } from '@/lib/storage';
import { questions } from '@/lib/questions-relations';

function sanitizeName(name: string) {
  return name.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'player';
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max - 1) + '…';
}

function extForMime(mime: string) {
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('ogg')) return '.ogg';
  if (mime.includes('mpeg')) return '.mp3';
  if (mime.includes('wav')) return '.wav';
  return '';
}

function lookupQuestionText(id: string): string | null {
  for (const rel of Object.keys(questions) as Array<keyof typeof questions>) {
    for (const side of ['p1', 'p2'] as const) {
      const found = questions[rel][side].find((q) => q.id === id);
      if (found) return found.text;
    }
  }
  return null;
}

function buildFolderName(game?: GameSession | null) {
  if (!game) return 'game_exports';
  const d = new Date(game.startedAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const datePart = `${y}-${m}-${day}`;
  const p1 = sanitizeName(game.p1Name || 'Player1');
  const p2 = sanitizeName(game.p2Name || 'Player2');
  return `${p1}_vs_${p2}_${datePart}`;
}

/**
 * Build a ZIP blob for a game without triggering download.
 * Used both by the web share flow and the download fallback.
 */
export async function buildGameZipBlob(
  game: GameSession | undefined,
  recs: SavedRecording[]
): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  const folderName = buildFolderName(game);
  const folder = zip.folder(folderName)!;

  for (const rec of recs) {
    const b = await getBlob(rec.blobKey);
    if (!b) continue;

    const questionText =
      lookupQuestionText(rec.meta.questionId) ?? rec.meta.questionId;

    const playerName =
      rec.meta.playerId === 'p1'
        ? game?.p1Name ?? 'Player 1'
        : game?.p2Name ?? 'Player 2';

    const baseName = `${sanitizeName(playerName)}-${sanitizeName(
      truncate(questionText, 40)
    )} (${rec.meta.points}pts)`;

    const ext = extForMime(rec.meta.mimeType);
    const fileName = `${baseName}${ext}`;

    folder.file(fileName, b);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${folderName}.zip`;
  return { blob, filename };
}

/**
 * Export a game as ZIP.
 * - If Web Share API with file sharing is available, opens the share sheet.
 * - Otherwise falls back to a normal "download" of the ZIP.
 */
export async function exportGameZip(
  game: GameSession | undefined,
  recs: SavedRecording[]
): Promise<void> {
  const { blob, filename } = await buildGameZipBlob(game, recs);

  // If we're not in a browser (SSR), just bail.
  if (typeof window === 'undefined') return;

  const navAny: any = typeof navigator !== 'undefined' ? navigator : null;

  try {
    // Try Web Share API with files (mobile browsers, some desktops)
    if (
      navAny &&
      typeof navAny.share === 'function' &&
      typeof navAny.canShare === 'function'
    ) {
      const file = new File([blob], filename, { type: 'application/zip' });
      if (navAny.canShare({ files: [file] })) {
        await navAny.share({
          files: [file],
          title: 'Histura Game Export',
          text: 'Here is our Histura game recording export.',
        });
        return; // done
      }
    }
  } catch {
    // If share fails for any reason, fall through to download
  }

  // Fallback: normal download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
