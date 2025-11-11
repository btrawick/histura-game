// src/routes/Home.tsx
import { useGame, sideLabels, Relationship } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const { relationship, setRelationship, players, setPlayer, resetScores, swapPlayers } = useGame();
  const [rel, setRel] = useState<Relationship>(relationship);

  useEffect(() => setRel(relationship), [relationship]);

  const labels = sideLabels[rel];

  return (
    <div className="container">
      <h1>Home</h1>

      {/* Relationship selector (lean) */}
      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <div className="label">Relationship Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          <select
            value={rel}
            onChange={(e) => setRel(e.target.value as Relationship)}
            style={{ width: '100%', fontSize: 16, padding: '10px 12px' }}
          >
            <option value="kid-parent">Kid ↔ Parent</option>
            <option value="adultchild-parent">Adult Child ↔ Parent</option>
            <option value="friend-friend">Friend ↔ Friend</option>
            <option value="kid-grandparent">Kid ↔ Grandparent</option>
          </select>
          <button className="button" onClick={() => setRelationship(rel)} title="Apply selected relationship">
            Apply
          </button>
        </div>
      </div>

      {/* Players section with Play button placed here */}
      <div
        className="card"
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        {/* Player 1 */}
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

        {/* Player 2 */}
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

        {/* Actions row: Swap + Play */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button secondary" onClick={swapPlayers} title="Swap players (including roles)">
              Swap players
            </button>
          </div>
          <button
            className="button"
            onClick={() => {
              // apply relationship, reset scores, and go Play
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


