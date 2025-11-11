// src/lib/export.ts
import JSZip from 'jszip';
import { getBlob } from '@/lib/storage';
import type { SavedRecording } from '@/types';

export async function exportGameZip(gameId: string, recs: SavedRecording[], title: string) {
  const zip = new JSZip();
  const folder = zip.folder(safe(title)) || zip;

  for (const r of recs) {
    const blob = await getBlob(r.blobKey);
    if (!blob) continue;
    const ext = r.meta.kind === 'video' ? 'webm' : 'webm'; // recorder uses webm typically
    const fname = `${r.meta.startedAt}-${r.meta.playerId}-${r.meta.points}pts.${ext}`;
    folder.file(fname, blob);
  }

  const out = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(out);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safe(title)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safe(s: string) { return s.replace(/[^\w.-]+/g, '_'); }
