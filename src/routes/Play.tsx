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

export default function Play() {
  const { players, relationship, preferredKind, addScore, addRecording, highScore } = useGame();
  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1');
  const [question, setQuestion] = useState(() => getRandomQuestionFor(relationship, 'p1'));
  const rec = useRecorder(preferredKind);
  const mediaEl = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Overlay countdown state
  const [overlay, setOverlay] = useState<{ show: boolean; next: 'p1' | 'p2'; count: number }>({
    show: false,
    next: 'p2',
    count: 3,
  });
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
    // relationship changed -> refresh question for current side
    setQuestion(getRandomQuestionFor(relationship, currentPlayer));
  }, [relationship, currentPlayer]);

  function triggerConfetti() {
    setConfetti((n) => n + 1);
    setTimeout(() => setConfetti((n) => n - 1), 1200);
  }

  function startCountdown(next: 'p1' | 'p2') {
    setOverlay({ show: true, next, count: 3 });
    let c = 3;
    const iv = setInterval(() => {
      c -= 1;
      setOverlay((o) => ({ ...o, count: c }));
      if (c === 0) {
        clearInterval(iv);
        setOverlay({ show: false, next, count: 3 });
        setCurrentPlayer(next);
        setQuestion(getRandomQuestionFor(relationship, next));
        rec.start();
      }
    }, 380);
  }

  async function handleStop() {
    const blob = await rec.stop();
    if (!blob) return;
    const dur = rec.elapsed;
    const points = pointsForDuration(dur);
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

    // scoring + confetti when beating high score
    const prevHigh = highScore;
    addScore(currentPlayer, points);
    if (points + players[currentPlayer].score > prevHigh) triggerConfetti();

    // end-of-round summary after both have spoken once
    const pair = [...lastPair, meta];
    if (pair.length === 2 && pair.some((m) => m.playerId === 'p1') && pair.some((m) => m.playerId === 'p2')) {
      setLastPair([]);
      setShowSummary(true);
      setTimeout(() => setShowSummary(false), 4000);
    } else {
      setLastPair(pair);
    }

    startCountdown(other);
  }

  return (
    <div className="container">
      {confetti > 0 && <div className="confetti">🎉✨🎊</div>}
      <h1>Play</h1>

      <div className="card">
        <div className="label">Current Player</div>
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
          <KindToggle />
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
          <div className="overlay-card">
            <div className="label">Next Turn</div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{players[overlay.next].name}</div>
            <div className="count">{overlay.count}</div>
          </div>
        </div>
      )}

      {showSummary && <RoundSummary />}
    </div>
  );
}

function KindToggle() {
  const kind = useGame((s) => s.preferredKind);
  const setKind = useGame((s) => s.setPreferredKind);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button className={`button ${kind === 'video' ? '' : 'secondary'}`} onClick={() => setKind('video')}>
        Video
      </button>
      <button className={`button ${kind === 'audio' ? '' : 'secondary'}`} onClick={() => setKind('audio')}>
        Audio
      </button>
    </div>
  );
}

function RoundSummary() {
  const { recordings, players } = useGame();
  const recent = recordings.slice(0, 2); // last pair
  if (recent.length < 2) return null;
  const p1 = recent.find((r) => r.meta.playerId === 'p1')!;
  const p2 = recent.find((r) => r.meta.playerId === 'p2')!;
  const winner = p1.meta.points === p2.meta.points ? 'Tie' : p1.meta.points > p2.meta.points ? players.p1.name : players.p2.name;
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
      </div>
    </div>
  );
}
