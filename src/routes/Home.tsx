// src/routes/Home.tsx
import { useGame, sideLabels } from '@/lib/store';
import type { Relationship } from '@/types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarCapture from '@/components/AvatarCapture';

export default function Home() {
  const navigate = useNavigate();
  const { relationship, setRelationship, players, setPlayer, resetScores, swapPlayers, startNewGame } = useGame();
  const [rel, setRel] = useState<Relationship>(relationship);
  const [captureFor, setCaptureFor] = useState<null | 'p1' | 'p2'>(null);

  useEffect(() => setRel(relationship), [relationship]);

  const labels = sideLabels[rel];
  const toTitle = (s?: string) => (s ? s.slice(0,1).toUpperCase() + s.slice(1) : '');

  return (
    <div className="container">
      <h1>Home</h1>

      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <div className="label">Relationship Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
          // inside the <select> in Home.tsx:
          <select
  value={rel}
  onChange={(e) => setRel(e.target.value as Relationship)}
  style={{ width: '100%', fontSize: 16, padding: '10px 12px' }}
>
  <option value="kid-parent">Kid ↔ Parent</option>
  <option value="adultchild-parent">Adult Child ↔ Parent</option>
  <option value="friend-friend">Friend ↔ Friend</option>
  <option value="kid-grandparent">Kid ↔ Grandparent</option>
  <option value="kid-kid">Kid ↔ Kid</option>
  <option value="sibling-sibling">Adult Sibling ↔ Adult Sibling</option>
</select>
          <button className="button" onClick={() => setRelationship(rel)} title="Apply selected relationship">
            Apply
          </button>
        </div>
      </div>

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
            <select value={toTitle(players.p1.role)} disabled>
              <option>{toTitle(players.p1.role)}</option>
            </select>
            <AvatarPreview
              name={players.p1.name || labels.p1}
              dataUrl={players.p1.avatarDataUrl}
              onClick={() => setCaptureFor('p1')}
            />
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
            <select value={toTitle(players.p2.role)} disabled>
              <option>{toTitle(players.p2.role)}</option>
            </select>
            <AvatarPreview
              name={players.p2.name || labels.p2}
              dataUrl={players.p2.avatarDataUrl}
              onClick={() => setCaptureFor('p2')}
            />
          </div>
        </div>

        {/* Actions row: Swap + centered Play */}
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          <div>
            <button className="button secondary" onClick={swapPlayers} title="Swap players (including roles)">
              Swap players
            </button>
          </div>
          <button
  className="button play"
  onClick={() => {
    setRelationship(rel);
    resetScores();
    startNewGame();
    navigate('/play');
  }}
  title="Start a fresh game"
  style={{ justifySelf: 'center', minWidth: 140 }}
>
  ▶ Play
</button>
          <div />
        </div>
      </div>

      {captureFor && (
        <AvatarCapture
          onCancel={() => setCaptureFor(null)}
          onSave={(dataUrl) => {
            setPlayer(captureFor, { avatarDataUrl: dataUrl });
            setCaptureFor(null);
          }}
        />
      )}
    </div>
  );
}

function AvatarPreview({
  name, dataUrl, onClick,
}: { name: string; dataUrl?: string; onClick?: () => void }) {
  const src = dataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(name || 'player')}`;
  return (
    <img
      src={src}
      width={72}
      height={72}
      alt="avatar"
      onClick={onClick}
      style={{
        borderRadius: 12,
        width: 72,
        height: 72,
        objectFit: 'cover',
        background: '#0b1220',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: onClick ? '0 0 0 2px rgba(255,255,255,0.06)' : undefined,
      }}
      title={onClick ? 'Click to take profile photo' : undefined}
    />
  );
}
