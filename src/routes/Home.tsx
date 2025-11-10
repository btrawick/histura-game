// src/routes/Home.tsx
import { useGame, sideLabels, Relationship } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function Home() {
  const { relationship, setRelationship, players, setPlayer } = useGame();
  const [rel, setRel] = useState<Relationship>(relationship);

  useEffect(() => {
    setRel(relationship);
  }, [relationship]);

  const labels = sideLabels[rel];

  return (
    <div className="container">
      <h1>Home</h1>

      <div className="card">
        <div className="label">Relationship Mode</div>
        <select
          value={rel}
          onChange={(e) => setRel(e.target.value as Relationship)}
          style={{ marginTop: 8, width: '100%' }}
        >
          <option value="kid-parent">Kid ↔ Parent</option>
          <option value="adultchild-parent">Adult Child ↔ Parent</option>
          <option value="friend-friend">Friend ↔ Friend</option>
          <option value="kid-grandparent">Kid ↔ Grandparent</option>
        </select>
        <button className="button" style={{ marginTop: 8 }} onClick={() => setRelationship(rel)}>
          Apply Relationship
        </button>
        <p style={{ opacity: 0.8, marginTop: 6 }}>
          Prompts are tailored to the selected relationship. The person shown as “Current Player” in Play is the one
          <b> answering</b>.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="label">Players</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
          {/* Player 1 */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Player 1</div>
            <input
              type="text"
              placeholder={labels.p1}
              value={players.p1.name}
              onChange={(e) => setPlayer('p1', { name: e.target.value })}
              style={{ width: '100%', marginBottom: 6 }}
            />
            <select value={labels.p1} disabled style={{ width: '100%' }}>
              <option>{labels.p1}</option>
            </select>
          </div>

          {/* Player 2 */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Player 2</div>
            <input
              type="text"
              placeholder={labels.p2}
              value={players.p2.name}
              onChange={(e) => setPlayer('p2', { name: e.target.value })}
              style={{ width: '100%', marginBottom: 6 }}
            />
            <select value={labels.p2} disabled style={{ width: '100%' }}>
              <option>{labels.p2}</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            className="button secondary"
            onClick={() => {
              // swap P1 and P2 names/avatars (roles stay tied to relationship)
              const p1 = players.p1;
              const p2 = players.p2;
              setPlayer('p1', { name: p2.name, avatarDataUrl: p2.avatarDataUrl });
              setPlayer('p2', { name: p1.name, avatarDataUrl: p1.avatarDataUrl });
            }}
          >
            Swap players
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="label">Heads-up</div>
        <p style={{ marginTop: 6, opacity: 0.85 }}>
          In <b>Play</b>, “Next up (answering): Kid/Parent/etc.” means that person will be <b>recorded answering</b> a prompt
          designed for them. You can switch cameras on the ready popup (Video → Switch camera).
        </p>
      </div>
    </div>
  );
}

