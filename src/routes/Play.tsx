// src/routes/Play.tsx
// ...imports stay the same
import { useNavigate } from 'react-router-dom';

type OverlayMode = 'ready' | 'countdown';
const promptSideForSpeaker = (speaker: 'p1' | 'p2'): 'p1' | 'p2' => (speaker === 'p1' ? 'p2' : 'p1');

export default function Play() {
  const navigate = useNavigate();
  const {
    players, relationship, preferredKind,
    addScore, addRecording, highScore, starScale,
    resetScores, resetGame,
  } = useGame();

  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1');
  const [question, setQuestion] = useState(() =>
    getRandomQuestionFor(relationship, promptSideForSpeaker('p1'))
  );
  const rec = useRecorder(preferredKind);

  const mainMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const overlayMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const [overlay, setOverlay] = useState<{ show: boolean; next: 'p1' | 'p2'; mode: OverlayMode; count: number }>({
    show: true, next: 'p1', mode: 'ready', count: 3,
  });
  const [endOpen, setEndOpen] = useState(false);
  const [lastPair, setLastPair] = useState<SavedRecording['meta'][]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => { rec.ensurePermission().catch(() => {}); }, []); // warm up
  useEffect(() => {
    const el = overlay.show ? overlayMediaRef.current : mainMediaRef.current;
    if (el) rec.attach(el);
  }, [overlay.show, preferredKind]); // attach to visible surface

  useEffect(() => {
    setQuestion(getRandomQuestionFor(relationship, promptSideForSpeaker(currentPlayer)));
  }, [relationship, currentPlayer]);

  function triggerConfetti() {
    setConfetti((n) => n + 1);
    setTimeout(() => setConfetti((n) => n - 1), 1200);
  }

  function beginCountdown(next: 'p1' | 'p2') {
    setOverlay({ show: true, next, mode: 'countdown', count: 3 });
    let c = 3;
    const iv = setInterval(() => {
      c -= 1;
      setOverlay((o) => ({ ...o, count: c }));
      if (c <= 0) {
        clearInterval(iv);
        setOverlay({ show: false, next, mode: 'ready', count: 3 });
        startTurn(next);
      }
    }, 1000);
  }

  function startTurn(next: 'p1' | 'p2') {
    setCurrentPlayer(next);
    setQuestion(getRandomQuestionFor(relationship, promptSideForSpeaker(next)));
    if (mainMediaRef.current) rec.attach(mainMediaRef.current);
    rec.start();
  }

  async function handleStop() {
    const blob = await rec.stop();
    if (!blob) return;
    const dur = rec.elapsed;
    const points = pointsForDuration(dur, starScale);
    const id = crypto.randomUUID();
    const blobKey = await saveBlob(blob);
    const meta: SavedRecording['meta'] = {
      id, playerId: currentPlayer, questionId: question.id, category: question.bucket,
      startedAt: Date.now() - Math.round(dur * 1000), stoppedAt: Date.now(),
      durationSec: dur, points, kind: preferredKind, mimeType: blob.type,
    };
    addRecording({ meta, blobKey });

    const other: 'p1' | 'p2' = currentPlayer === 'p1' ? 'p2' : 'p1';

    const prevHigh = highScore;
    addScore(currentPlayer, points);
    if (points + players[currentPlayer].score > prevHigh) triggerConfetti();

    const pair = [...lastPair, meta];
    if (pair.length === 2 && pair.some((m) => m.playerId === 'p1') && pair.some((m) => m.playerId === 'p2')) {
      setLastPair([]);
      setShowSummary(true); // stays until Continue / End Game
    } else {
      setLastPair(pair);
      setOverlay({ show: true, next: other, mode: 'ready', count: 3 });
      if (overlayMediaRef.current) rec.attach(overlayMediaRef.current);
    }
  }

  return (
    <div className="container">
      {confetti > 0 && <div className="confetti">🎉✨🎊</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Play</h1>
        <button className="button secondary" onClick={() => setEndOpen(true)} title="Finish or reset the game">
          End Game
        </button>
      </div>

      <div className="card">
        <div className="label">Current Player (answering)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={players[currentPlayer].avatarDataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${players[currentPlayer].name}`}
            width={40} height={40} style={{ borderRadius: 8 }}
          />
          <strong>{players[currentPlayer].name}</strong> ({players[currentPlayer].role})
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="label">Prompt</div>
        <div style={{ fontSize: 20, marginBottom: 12 }}>{question.text}</div>
        <TimerAndStars sec={rec.elapsed} />
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <RecordButton recording={rec.recording} onStart={rec.start} onStop={handleStop} />
          <div className="label">Kind</div>
          <KindToggle onVideoClick={() => rec.cycleCamera()} />
        </div>
               <div style={{ marginTop: 16 }}>
          {preferredKind === 'video' ? (
            <video
              ref={mainMediaRef as any}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', borderRadius: 8 }}
            />
          ) : (
            <audio ref={mainMediaRef as any} autoPlay />
          )}
        </div>

      </div>

      {overlay.show && (
        <div className="overlay">
          <div className="overlay-card" style={{ width: 520, maxWidth: '95vw' }}>
            <div className="label">Next up (answering)</div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{players[overlay.next].name}</div>

<div className="card" style={{ background: '#0b1220', borderRadius: 12, padding: 12 }}>
  {preferredKind === 'video' ? (
    <video
      ref={overlayMediaRef as any}
      autoPlay
      muted
      playsInline
      style={{ width: '100%', borderRadius: 8 }}
    />
  ) : (
    <audio ref={overlayMediaRef as any} autoPlay />
  )}
</div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
              {preferredKind === 'video' && (
                <button className="button secondary" onClick={() => rec.cycleCamera()}>
                  Switch camera
                </button>
              )}
              <KindToggle small onVideoClick={() => rec.cycleCamera()} />
            </div>

            {overlay.mode === 'ready'
              ? <button className="button" style={{ marginTop: 12 }} onClick={() => beginCountdown(overlay.next)}>Start</button>
              : <div className="count" style={{ marginTop: 12 }}>{overlay.count}</div>
            }
          </div>
        </div>
      )}

      {endOpen && (
        <EndGameOverlay
          onClose={() => setEndOpen(false)}
          onFinish={() => { setEndOpen(false); navigate('/playback'); }}
          onRematch={() => {
            resetScores();
            setEndOpen(false);
            setOverlay({ show: true, next: 'p1', mode: 'ready', count: 3 });
            setCurrentPlayer('p1');
            setQuestion(getRandomQuestionFor(relationship, promptSideForSpeaker('p1')));
            if (overlayMediaRef.current) rec.attach(overlayMediaRef.current);
          }}
          onNewGame={() => { resetGame(); setEndOpen(false); navigate('/'); }}
        />
      )}

      {showSummary && (
        <RoundSummary
          onEndGame={() => { setShowSummary(false); setEndOpen(true); }}  {/* close summary first */}
          onContinue={() => {
            setShowSummary(false);
            const other: 'p1' | 'p2' = currentPlayer === 'p1' ? 'p2' : 'p1';
            setOverlay({ show: true, next: other, mode: 'ready', count: 3 });
            if (overlayMediaRef.current) rec.attach(overlayMediaRef.current);
          }}
        />
      )}
    </div>
  );
}

// KindToggle, RoundSummary, EndGameOverlay unchanged from your last version except the onEndGame handler above
// (keep your existing component code)

