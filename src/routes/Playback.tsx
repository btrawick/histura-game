// src/routes/Playback.tsx
import { useEffect, useMemo, useState } from 'react';
import { useGame } from '@/lib/store';
import { exportGameZip } from '@/lib/export';
import { questions } from '@/lib/questions-relations';
import { getBlob, deleteBlob } from '@/lib/storage';
import { tryShareGame, tryShareRecording } from '@/lib/share';
import type { SavedRecording } from '@/types';

export default function Playback() {
  const { recordings, games, deleteGame } = useGame();

  const byGame = useMemo(() => {
    const map = new Map<string, SavedRecording[]>();
    recordings.forEach((r) => {
      const list = map.get(r.meta.gameId) || [];
      list.push(r);
      map.set(r.meta.gameId, list);
    });
    return Array.from(map.entries()).map(([gameId, recs]) => ({ gameId, recs }));
  }, [recordings]);

  const [busy, setBusy] = useState<string | null>(null);

  const gameMeta = (id: string) => games.find((g) => g.id === id);

  return (
    <div className="container">
      <h1>Playback & Scores</h1>
      {byGame.length === 0 && <div className="card">No recordings yet.</div>}

      {byGame.map(({ gameId, recs }) => {
        const g = gameMeta(gameId);
        const title = g
          ? `${labelFor(g.relationship)}: ${g.p1Name} vs ${g.p2Name}`
          : `Game ${gameId.slice(0, 8)}`;
        const started = g ? new Date(g.startedAt).toLocaleString() : '';

        return (
          <div key={gameId} className="card" style={{ marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div className="label">{started}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
              </div>

              {g && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    className="button secondary"
                    disabled={busy === `delete:${gameId}` || busy === `share:${gameId}` || busy === gameId}
                    onClick={async () => {
                      const ok = window.confirm(
                        'Are you sure? Deleting this game will remove its recordings.'
                      );
                      if (!ok) return;
                      setBusy(`delete:${gameId}`);
                      try {
                        for (const r of recs) {
                          await deleteBlob(r.blobKey);
                        }
                        deleteGame(gameId);
                      } finally {
                        setBusy(null);
                      }
                    }}
                    title="Delete this game and its recordings"
                  >
                    {busy === `delete:${gameId}` ? 'Deleting…' : 'Delete Game'}
                  </button>

                  <button
                    className="button secondary"
                    disabled={busy === `share:${gameId}` || busy === `delete:${gameId}` || busy === gameId}
                    onClick={async () => {
                      setBusy(`share:${gameId}`);
                      try {
                        const ok = await tryShareGame(g, recs);
                        if (!ok) {
                          window.alert(
                            'Sharing a full game ZIP is not available here. Try sharing individual recordings below (recommended on iPhone).'
                          );
                        }
                      } catch {
                        window.alert('Sharing failed. Try individual recording share below.');
                      } finally {
                        setBusy(null);
                      }
                    }}
                    title="Share this game (may fail on iPhone if large)"
                  >
                    {busy === `share:${gameId}` ? 'Sharing…' : 'Share Game'}
                  </button>

                  <button
                    className="button"
                    disabled={busy === gameId || busy === `share:${gameId}` || busy === `delete:${gameId}`}
                    onClick={async () => {
                      setBusy(gameId);
                      try {
                        await exportGameZip(g, recs);
                      } finally {
                        setBusy(null);
                      }
                    }}
                    title="Export recordings from this game as a ZIP"
                  >
                    {busy === gameId ? 'Exporting…' : 'Export ZIP'}
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {recs.map((r) => {
                const q = lookupQuestion(r.meta.questionId);
                const name =
                  r.meta.playerId === 'p1'
                    ? g?.p1Name ?? 'Player 1'
                    : g?.p2Name ?? 'Player 2';

                const truncatedQ = truncate(q?.text ?? r.meta.questionId, 60);
                const label = `${name} — ${truncatedQ} (${r.meta.points} pts)`;

                const safeFile = makeRecordingFilename(name, truncatedQ, r);

                return (
                  <PlaybackRow
                    key={r.meta.id}
                    rec={r}
                    label={label}
                    filename={safeFile}
                    busy={busy === `recshare:${r.meta.id}`}
                    onShare={async () => {
                      setBusy(`recshare:${r.meta.id}`);
                      try {
                        const ok = await tryShareRecording(r, safeFile);
                        if (!ok) {
                          // Fallback download
                          await downloadRecording(r, safeFile);
                        }
                      } finally {
                        setBusy(null);
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlaybackRow({
  rec,
  label,
  filename,
  busy,
  onShare,
}: {
  rec: SavedRecording;
  label: string;
  filename: string;
  busy: boolean;
  onShare: () => void;
}) {
  const url = useObjectURL(rec.blobKey);

  return (
    <div
      className="row"
      style={{
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={label}
        >
          {label}
        </div>

        <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="button secondary" onClick={onShare} disabled={busy} title="Share or download this recording">
            {busy ? 'Sharing…' : 'Share'}
          </button>
          <span style={{ fontSize: 12, opacity: 0.75 }}>{filename}</span>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {rec.meta.kind === 'video' ? (
          <video controls src={url ?? undefined} style={{ maxWidth: 240, borderRadius: 8 }} />
        ) : (
          <audio controls src={url ?? undefined} />
        )}
      </div>
    </div>
  );
}

function useObjectURL(key: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    let u: string | null = null;

    (async () => {
      const b = await getBlob(key);
      if (!mounted || !b) return;
      u = URL.createObjectURL(b);
      setUrl(u);
    })();

    return () => {
      mounted = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [key]);
  return url;
}

async function downloadRecording(rec: SavedRecording, filename: string) {
  const blob = await getBlob(rec.blobKey);
  if (!blob) {
    window.alert('Could not load recording data.');
    return;
  }
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function makeRecordingFilename(name: string, truncatedQ: string, r: SavedRecording) {
  const ext = r.meta.kind === 'video' ? 'webm' : 'webm';
  // Many iPhone browsers still end up with video/webm from MediaRecorder; keep ext consistent.
  const base = `${slug(name)}-${slug(truncatedQ)}-${r.meta.points}pts`;
  return `${base}.${ext}`;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function labelFor(rel: string) {
  switch (rel) {
    case 'kid-parent':
      return 'Kid vs Parent';
    case 'adultchild-parent':
      return 'Adult Child vs Parent';
    case 'friend-friend':
      return 'Friend vs Friend';
    case 'kid-grandparent':
      return 'Kid vs Grandparent';
    case 'kid-kid':
      return 'Kid vs Kid';
    case 'sibling-sibling':
      return 'Adult Sibling vs Adult Sibling';
    default:
      return rel;
  }
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
