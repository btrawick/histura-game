import JSZip from 'jszip';
import { getBlob } from '@/lib/storage';
import { questions } from '@/lib/questions-relations';
import type { GameSession, SavedRecording } from '@/types';

export async function exportGameZip(game: GameSession, recs: SavedRecording[]) {
  const { blob, filename } = await exportGameZipBuildBlob(game, recs);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Build the ZIP blob (used by both Download + Web Share)
export async function exportGameZipBuildBlob(game: GameSession, recs: SavedRecording[]) {
  const zip = new JSZip();

  const folderName = `(${safe(game.p1Name)}_vs_${safe(game.p2Name)}_${fmtDate(game.startedAt)})`;
  const folder = zip.folder(folderName) || zip;

  for (const r of recs) {
    const media = await getBlob(r.blobKey);
    if (!media) continue;

    const q = lookupQuestion(r.meta.questionId)?.text ?? r.meta.questionId;
    const playerName = r.meta.playerId === 'p1' ? game.p1Name : game.p2Name;

    const base = `${playerName} — ${truncate(q, 60)}`; // Name — truncated question
    const ext = guessExt(r.meta.mimeType) || 'webm';
    const fname = `${safe(base)}.${ext}`;

    folder.file(fname, media);
  }

  const out = await zip.generateAsync({ type: 'blob' });
  const filename = `${folderName}.zip`;
  return { blob: out, filename };
}

function lookupQuestion(id: string) {
  for (const rel of Object.keys(questions) as Array<keyof typeof questions>) {
    for (const side of ['p1', 'p2'] as const) {
      const found = questions[rel][side].find((q) => q.id === id);
      if (found) return found;
    }
  }
  return null;
}

function guessExt(mime: string | undefined) {
  if (!mime) return null;
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg')) return 'mp3';
  return null;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function safe(s: string) {
  return s.replace(/[^\w.\- ]+/g, '_').trim().replace(/\s+/g, ' ');
}
