// src/routes/Playback.tsx
import { useMemo, useState } from 'react';
import { useGame } from '@/lib/store';
import { exportGameZip } from '@/lib/export';
import { questions } from '@/lib/questions-relations';

export default function Playback() {
  const { recordings, games } = useGame();
  const byGame = useMemo(() => {
    const map = new Map<string, typeof recordings>();
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
              <button
                className="button"
                disabled={busy === gameId}
                onClick={async () => {
                  setBusy(gameId);
                  try { await exportGameZip(gameId, recs, title); } finally { setBusy(null); }
                }}
                title="Export recordings from this game as a ZIP"
              >
                {busy === gameId ? 'Exporting…' : 'Export ZIP'}
              </button>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {recs.map((r) => {
                const q = lookupQuestion(r.meta.questionId);
                const who = r.meta.playerId === 'p1' ? 'P1' : 'P2';
                const name = r.meta.playerId === 'p1' ? (g?.p1Name ?? 'Player 1') : (g?.p2Name ?? 'Player 2');
                const label = `${name} — ${truncate(q?.text ?? r.meta.questionId, 60)}: ${r.meta.points} pts`;
                return (
                  <div key={r.meta.id} className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
                    <div>{label}</div>
                    <audio controls src={URL.createObjectURL(new Blob([], { type: r.meta.mimeType }))} style={{ display: r.meta.kind === 'audio' ? 'block' : 'none' }} />
                    {r.meta.kind === 'video' && <div style={{ opacity: 0.7, fontSize: 12 }}>(video)</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
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
  // questions: Record<rel, {p1:[], p2:[]}>
  for (const rel of Object.keys(questions) as Array<keyof typeof questions>) {
    for (const side of ['p1', 'p2'] as const) {
      const found = questions[rel][side].find((q) => q.id === id);
      if (found) return found;
    }
  }
  return null;
}

