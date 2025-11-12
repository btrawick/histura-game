import { useEffect, useMemo, useState } from 'react';
import { useGame } from '@/lib/store';
import { exportGameZip } from '@/lib/export';
import { questions } from '@/lib/questions-relations';
import { getBlob } from '@/lib/storage';
import type { SavedRecording } from '@/types';

// Optional Web Share (only visible if supported)
let canShareFiles = false;
try {
  canShareFiles =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    (navigator as any).canShare?.({ files: [new File(['x'], 'x.zip', { type: 'application/zip' })] });
} catch { /* noop */ }

export default function Playback() {
  const { recordings, games } = useGame();

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="label">{started}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
              </div>
              {g && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="button"
                    disabled={busy === gameId}
                    onClick={async () => {
                      setBusy(gameId);
                      try { await exportGameZip(g, recs); } finally { setBusy(null); }
                    }}
                    title="Export this game's recordings as a ZIP"
                  >
                    {busy === gameId ? 'Exporting…' : 'Export ZIP'}
                  </button>

                  {canShareFiles && (
                    <ShareButton
                      disabled={busy === `${gameId}-share`}
                      onBusy={(b) => setBusy(b ? `${gameId}-share` : null)}
                      gameId={gameId}
                      gameTitle={title}
                      game={g}
                      recs={recs}
                    />
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {recs.map((r) => {
                const q = lookupQuestion(r.meta.questionId);
                const name = r.meta.playerId === 'p1' ? g?.p1Name ?? 'Player 1' : g?.p2Name ?? 'Player 2';
                const label = `${name} — ${truncate(q?.text ?? r.meta.questionId, 60)} (${r.meta.points} pts)`;
                return <PlaybackRow key={r.meta.id} rec={r} label={label} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShareButton({
  disabled,
  onBusy,
  gameId,
  gameTitle,
  game,
  recs,
}: {
  disabled: boolean;
  onBusy: (b: boolean) => void;
  gameId: string;
  gameTitle: string;
  game: { p1Name: string; p2Name: string; startedAt: number };
  recs: SavedRecording[];
}) {
  return (
    <button
      className="button secondary"
      disabled={disabled}
      onClick={async () => {
        onBusy(true);
        try {
          // build zip blob and share via native sheet (fallback to export if blocked)
          const { exportGameZipBuildBlob } = await import('@/lib/export');
          const { blob, filename } = await exportGameZipBuildBlob(
            { ...game, id: gameId, relationship: 'kid-parent' as any }, // relationship not used here
            recs
          );
          const file = new File([blob], filename, { type: 'application/zip' });
          if ((navigator as any).canShare?.({ files: [file] })) {
            await (navigator as any).share({ files: [file], title: gameTitle, text: gameTitle });
          } else {
            const { exportGameZip } = await import('@/lib/export');
            await exportGameZip({ ...game, id: gameId, relationship: 'kid-parent' as any }, recs);
          }
        } catch {
          const { exportGameZip } = await import('@/lib/export');
          await exportGameZip({ ...game, id: gameId, relationship: 'kid-parent' as any }, recs);
        } finally {
          onBusy(false);
        }
      }}
      title="Share via native share sheet"
    >
      Share
    </button>
  );
}

function PlaybackRow({ rec, label }: { rec: SavedRecording; label: string }) {
  const url = useObjectURL(rec.blobKey);
  return (
    <div className="row" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
      {rec.meta.kind === 'video' ? (
        <video controls src={url ?? undefined} style={{ maxWidth: 240, borderRadius: 8 }} />
      ) : (
        <audio controls src={url ?? undefined} />
      )}
    </div>
  );
}

function useObjectURL(key: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const b = await getBlob(key);
      if (!mounted || !b) return;
      const u = URL.createObjectURL(b);
      setUrl(u);
    })();
    return () => {
      mounted = false;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return url;
}

function truncate(s: string, n: number) { return s.length <= n ? s : s.slice(0, n - 1) + '…'; }
function labelFor(rel: string) {
  switch (rel) {
    case 'kid-parent': return 'Kid vs Parent';
    case 'adultchild-parent': return 'Adult Child vs Parent';
    case 'friend-friend': return 'Friend vs Friend';
    case 'kid-grandparent': return 'Kid vs Grandparent';
    default: return rel;
  }
}

// quick lookup by id
function lookupQuestion(id: string) {
  for (const rel of Object.keys(questions) as Array<keyof typeof questions>) {
    for (const side of ['p1', 'p2'] as const) {
      const found = questions[rel][side].find((q) => q.id === id);
      if (found) return found;
    }
  }
  return null;
}
