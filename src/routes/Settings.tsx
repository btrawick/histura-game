// src/routes/Settings.tsx
import { useGame } from '@/lib/store';

export default function Settings() {
  const kind = useGame((s) => s.preferredKind);
  const setKind = useGame((s) => s.setPreferredKind);

  function handleKind(next: 'audio' | 'video') {
    setKind(next);
  }

  return (
    <div className="container">
      <h1>Settings</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Recording Mode</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={`button ${kind === 'video' ? '' : 'secondary'}`}
            onClick={() => handleKind('video')}
          >
            Video
          </button>
          <button
            className={`button ${kind === 'audio' ? '' : 'secondary'}`}
            onClick={() => handleKind('audio')}
          >
            Audio
          </button>
        </div>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Prompts are now chosen by <b>Relationship</b> (set on the Home page). Categories UI has been removed.
        </p>
      </div>

      <div className="card">
        <div className="label">Storage & Export</div>
        <p style={{ opacity: 0.9 }}>
          Recordings are stored locally in your browser (IndexedDB). Use the <b>Playback</b> tab to export a ZIP
          (media + JSON metadata).
        </p>
      </div>
    </div>
  );
}

