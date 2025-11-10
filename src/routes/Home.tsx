// src/routes/Home.tsx
import { useGame, sideLabels, Relationship } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { relationship, setRelationship, players, setPlayer, resetScores } = useGame();
  const [rel, setRel] = useState<Relationship>(relationship);

  useEffect(() => setRel(relationship), [relationship]);

  const labels = sideLabels[rel];

  return (
    <div className="container">
      <h1>Home</h1>

      {/* Top row: Relationship + Play */}
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
          <div>
            <div className="label">Relationship Mode</div>
            <select
              value={rel}
              onChange={(e) => setRel(e.target.value as Relationship)}
              style={{ marginTop: 8, width: '100%', fontSize: 16, padding: '10px 12px' }}
            >
              <option value="kid-parent">Kid ↔ Parent</option>
              <option value="adultchild-parent">Adult Child ↔ Parent</option>
              <option value="friend-friend">Friend ↔ Friend</option>
              <option value="kid-grandparent">Kid ↔ Grandparent</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button" onClick={() => setRelationship(rel)} title="Apply selected relationship">
              Apply
            </button>
            <button
              className="button"
              onClick={() => {
                // ensure relationship applied, reset scores, then go play
                setRelationship(rel);
                resetScores();
                navigate('/play');
              }}
              title="Start a fresh game"
            >
              ▶ Play
            </button>
          </div>
        </div>
        <p style={{ opacity: 0.8, marginTop: -4 }}>
          Prompts match the relationship. In <b>Play</b>, “Next up (answering)” is the person being recorded.
        </p>
      </div>

      {/* Players row: tidy proportions, consistent widths */}
      <div
        className="card"
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {/* Player 1 card */}
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="label">Player 1</div>
          <input
            type="text"
            placeholder={labels.p1}
            value={players.p1.name}
            onChange={(e) => setPlayer('p1', { name: e.target.value })}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, alignItems: 'center' }}>
            <select value={labels.p1} disabled>
              <option>{labels.p1}</option>
            </select>
            <AvatarPreview name={players.p1.name || labels.p1} dataUrl={players.p1.avatarDataUrl} />
          </div>
        </div>

        {/* Player 2 card */}
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="label">Player 2</div>
          <input
            type="text"
            placeholder={labels.p2}
            value={players.p2.name}
            onChange={(e) => setPlayer('p2', { name: e.target.value })}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, alignItems: 'center' }}>
            <select value={labels.p2} disabled>
              <option>{labels.p2}</option>
            </select>
            <AvatarPreview name={players.p2.name || labels.p2} dataUrl={players.p2.avatarDataUrl} />
          </div>
        </div>

        {/* Actions row */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <button
            className="button secondary"
            onClick={() => {
              // swap P1 and P2 names/avatars
              const p1 = players.p1;
              const p2 = players.p2;
              setPlayer('p1', { name: p2.name, avatarDataUrl: p2.avatarDataUrl });
              setPlayer('p2', { name: p1.name, avatarDataUrl: p1.avatarDataUrl });
            }}
          >
            Swap players
          </button>
          <div style={{ opacity: 0.75, alignSelf: 'center' }}>
            Roles follow the selected relationship and are shown read-only here.
          </div>
        </div>
      </div>
    </div>
  );
}

function AvatarPreview({ name, dataUrl }: { name: string; dataUrl?: string }) {
  const src =
    dataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(name || 'player')}`;
  return (
    <img
      src={src}
      width={72}
      height={72}
      alt="avatar"
      style={{ borderRadius: 12, width: 72, height: 72, objectFit: 'cover', background: '#0b1220' }}
    />
  );
}

