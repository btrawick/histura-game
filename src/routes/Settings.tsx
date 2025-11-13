import { useGame } from '@/lib/store';
import ThemeSwitch from '@/components/ThemeSwitch';

export default function Settings() {
  const kind = useGame((s) => s.preferredKind);
  const setKind = useGame((s) => s.setPreferredKind);
  const starScale = useGame((s) => s.starScale);
  const setStarScale = useGame((s) => s.setStarScale);

  return (
    <div className="container">
      <h1>Settings</h1>

      {/* Appearance */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Appearance</div>
        <div style={{ marginTop: 8 }}>
          <ThemeSwitch />
        </div>
      </div>

      {/* Default Recording Mode */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="label">Default Recording Mode</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className={`button ${kind === 'video' ? '' : 'secondary'}`}
            onClick={() => setKind('video')}
            title="Use camera + microphone by default"
          >
            Video
          </button>
          <button
            className={`button ${kind === 'audio' ? '' : 'secondary'}`}
            onClick={() => setKind('audio')}
            title="Use microphone only by default"
          >
            Audio
          </button>
        </div>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Tip: In <b>Play</b>, you can switch cameras from the ready popup when using Video.
        </p>
      </div>

      {/* Stars timing scale */}
      <div className="card">
        <div className="label">Stars Timing</div>
        <div style={{ marginTop: 8 }}>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={starScale}
            onChange={(e) => setStarScale(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.8 }}>
            <span>Shorter answers ⭐ sooner</span>
            <span>scale: {starScale.toFixed(1)}×</span>
            <span>Longer answers ⭐ later</span>
          </div>
        </div>
      </div>
    </div>
  );
}
