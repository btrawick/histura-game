// src/routes/Play.tsx
import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/store';
import { useRecorder } from '@/hooks/useRecorder';
import TimerAndStars from '@/components/TimerAndStars';
import RecordButton from '@/components/RecordButton';
import { pointsForDuration } from '@/lib/scoring';
import { saveBlob } from '@/lib/storage';
import type { SavedRecording } from '@/types';
import { getRandomQuestionFor } from '@/lib/questions-relations';
import { useNavigate } from 'react-router-dom';

type OverlayMode = 'ready' | 'countdown';

// helper: when P1 (Kid) is answering, pick prompts for Kid => from the OTHER side’s list
const promptSideForSpeaker = (speaker: 'p1' | 'p2'): 'p1' | 'p2' => (speaker === 'p1' ? 'p2' : 'p1');

export default function Play() {
  const navigate = useNavigate();
  const {
    players,
    relationship,
    preferredKind,
    addScore,
    addRecording,
    highScore,
    starScale,
    resetScores,
    resetGame,
  } = useGame();

  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1');
  const [question, setQuestion] = useState(() =>
    getRandomQuestionFor(relationship, promptSideForSpeaker('p1'))
  );
  const rec = useRecorder(preferredKind);
  const mediaEl = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const [overlay, setOverlay] = useState<{ show: boolean; next: 'p1' | 'p2'; mode: OverlayMode; count: number }>({
    show: true,
    next: 'p1',
    mode: 'ready',
    count: 3,
  });
  const [endOpen, setEndOpen] = useState(false);
  const [lastPair, setLastPair] = useState<SavedRecording['meta'][]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    rec.ensurePermission().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    rec.attach(mediaEl.current);
  }, [mediaEl.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // relationship changed -> refresh prompt for whoever is answering next
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
    // pull prompts FOR the speaker (so they answer)
    setQuestion(getRandomQuestionFor(relationship, promptSideForSpeaker(next)));
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
      id,
      playerId: currentPlayer,
      questionId: question.id,
      category: question.bucket,
      startedAt: Date.now() - Math.round(dur * 1000),
      stoppedAt: Date.now(),
      durationSec: dur,
      points,
      kind: preferredKind,
      mimeType: blob.type,
    };
    addRecording({ meta, blobKey });

    const other: 'p1' | 'p2' = currentPlayer === 'p1' ? 'p2' : 'p1';

    const prevHigh = highScore;
    addScore(currentPlayer, points);
    if (points + players[currentPlayer].score > prevHigh) triggerConfetti();

    const pair = [...lastPair, meta];
    if (pair.length === 2 && pair.some((m) => m.playerId === 'p1') && pair.some((m) => m.playerId === 'p2')) {
      setLastPair([]);
      setShowSummary(true);
      setTimeout(() => setShowSummary(false), 4000);
    } else {
      setLastPair(pair);
    }

    setOverlay({ show: true, next: other, mode: 'ready', count: 3 });
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
            src={
              players[currentPlayer].avatarDataUrl ||
              `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${players[currentPlayer].name}`
            }
            width={40}
            height={40}
            style={{ borderRadius: 8 }}
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
          {rec.permission !== 'granted' ? (
            <div>Allow camera/microphone to play.</div>
          ) : preferredKind === 'video' ? (
            <video ref={mediaEl as any} autoPlay muted playsInline />
          ) : (
            <audio ref={mediaEl as any} autoPlay />
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
                <video ref={mediaEl as any} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8 }} />
              ) : (
                <audio ref={mediaEl as any} autoPlay />
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

            {overlay.mode === 'ready' ? (
              <button className="button" style={{ marginTop: 12 }} onClick={() => beginCountdown(overlay.next)}>
                Start
              </button>
            ) : (
              <div className="count" style={{ marginTop: 12 }}>{overlay.count}</div>
            )}
          </div>
        </div>
      )}

      {endOpen && (
        <EndGameOverlay
          onClose={() => setEndOpen(false)}
          onFinish={() => {
            setEndOpen(false);
            navigate('/playback');
          }}
          onRematch={() => {
            resetScores();
            setEndOpen(false);
            setOverlay({ show: true, next: 'p1', mode: 'ready', count: 3 });
            setCurrentPlayer('p1');
            setQuestion(getRandomQuestionFor(relationship, promptSideForSpeaker('p1')));
          }}
          onNewGame={() => {
            resetGame();
            setEndOpen(false);
            navigate('/');
          }}
        />
      )}

      {showSummary && <RoundSummary onEndGame={() => setEndOpen(true)} />}
    </div>
  );
}

function KindToggle({ onVideoClick, small }: { onVideoClick: () => void; small?: boolean }) {
  const kind = useGame((s) => s.preferredKind);
  const setKind = useGame((s) => s.setPreferredKind);

  const handleVideo = () => {
    if (kind === 'video') onVideoClick();
    else setKind('video');
  };

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        className={`button ${kind === 'video' ? '' : 'secondary'}`}
        onClick={handleVideo}
        style={small ? { padding: '8px 12px' } : undefined}
        title={kind === 'video' ? 'Click to switch camera' : 'Switch to Video'}
      >
        Video
      </button>
      <button
        className={`button ${kind === 'audio' ? '' : 'secondary'}`}
        onClick={() => setKind('audio')}
        style={small ? { padding: '8px 12px' } : undefined}
      >
        Audio
      </button>
    </div>
  );
}

function RoundSummary({ onEndGame }: { onEndGame: () => void }) {
  const { recordings, players } = useGame();
  const recent = recordings.slice(0, 2);
  if (recent.length < 2) return null;
  const p1 = recent.find((r) => r.meta.playerId === 'p1')!;
  const p2 = recent.find((r) => r.meta.playerId === 'p2')!;
  const winner =
    p1.meta.points === p2.meta.points ? 'Tie' : p1.meta.points > p2.meta.points ? players.p1.name : players.p2.name;
  const longest =
    p1.meta.durationSec === p2.meta.durationSec
      ? 'Tie'
      : p1.meta.durationSec > p2.meta.durationSec
      ? players.p1.name
      : players.p2.name;

  return (
    <div className="overlay">
      <div className="overlay-card">
        <div className="label">Round Summary</div>
        <div style={{ fontSize: 18, marginTop: 6 }}>
          Winner: <b>{winner}</b>
        </div>
        <div>
          Best Answer: <b>{Math.max(p1.meta.points, p2.meta.points)} pts</b>
        </div>
        <div>
          Longest: <b>{longest}</b>
        </div>
        <button className="button secondary" style={{ marginTop: 12 }} onClick={onEndGame}>
          End Game
        </button>
      </div>
    </div>
  );
}

function EndGameOverlay({
  onClose,
  onFinish,
  onRematch,
  onNewGame,
}: {
  onClose: () => void;
  onFinish: () => void;
  onRematch: () => void;
  onNewGame: () => void;
}) {
  const { players } = useGame();
  return (
    <div className="overlay">
      <div className="overlay-card" style={{ width: 520, maxWidth: '95vw' }}>
        <div className="label">End Game</div>
        <div style={{ margin: '6px 0 12px', opacity: 0.85 }}>
          You can review and export recordings on the <b>Playback</b> tab.
        </div>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{players.p1.name}</span>
            <b>{players.p1.score} pts</b>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>{players.p2.name}</span>
            <b>{players.p2.score} pts</b>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button className="button" onClick={onFinish}>Finish & Review</button>
          <button className="button secondary" onClick={onRematch}>Rematch (keep players)</button>
          <button className="button secondary" onClick={onNewGame}>New Game (reset all)</button>
          <button className="button ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
