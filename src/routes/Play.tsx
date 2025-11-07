import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/lib/store'
import { randomQuestion } from '@/lib/questions'
import { useRecorder } from '@/hooks/useRecorder'
import TimerAndStars from '@/components/TimerAndStars'
import RecordButton from '@/components/RecordButton'
import { pointsForDuration } from '@/lib/scoring'
import { saveBlob } from '@/lib/storage'
import { SavedRecording } from '@/types'

export default function Play() {
  const { players, categories, preferredKind, addScore, addRecording } = useGame()
  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1')
  const [question, setQuestion] = useState(() => randomQuestion(categories))
  const rec = useRecorder(preferredKind)
  const mediaEl = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)

  useEffect(() => { rec.ensurePermission().catch(() => {}) }, [])
  useEffect(() => rec.attach(mediaEl.current), [mediaEl.current])

  function nextTurn() {
    setCurrentPlayer((p) => (p === 'p1' ? 'p2' : 'p1'))
    setQuestion(randomQuestion(categories))
  }

  async function handleStop() {
    const blob = await rec.stop()
    if (!blob) return
    const dur = rec.elapsed
    const points = pointsForDuration(dur)
    addScore(currentPlayer, points)
    const id = crypto.randomUUID()
    const blobKey = await saveBlob(blob)
    const meta: SavedRecording['meta'] = {
      id,
      playerId: currentPlayer,
      questionId: question.id,
      category: question.category,
      startedAt: Date.now() - Math.round(dur * 1000),
      stoppedAt: Date.now(),
      durationSec: dur,
      points,
      kind: preferredKind,
      mimeType: blob.type
    }
    addRecording({ meta, blobKey })
    nextTurn()
  }

  return (
    <div className="container">
      <h1>Play</h1>
      <div className="card">
        <div className="label">Current Player</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <img src={players[currentPlayer].avatarDataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${players[currentPlayer].name}`}
               width={40} height={40} style={{ borderRadius:8 }} />
          <strong>{players[currentPlayer].name}</strong> ({players[currentPlayer].role})
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="label">Question</div>
        <div style={{ fontSize: 20, marginBottom: 12 }}>{question.text}</div>
        <TimerAndStars sec={rec.elapsed} />
        <div style={{ marginTop: 12, display:'flex', gap:12, alignItems:'center' }}>
          <RecordButton recording={rec.recording} onStart={rec.start} onStop={handleStop} />
          <div className="label">Kind</div>
          <KindToggle />
        </div>
        <div style={{ marginTop: 16 }}>
          {rec.permission !== 'granted' ? (
            <div>Allow camera/microphone to play.</div>
          ) : (
            preferredKind === 'video' ? (
              <video ref={mediaEl as any} autoPlay muted playsInline />
            ) : (
              <audio ref={mediaEl as any} autoPlay />
            )
          )}
        </div>
      </div>
    </div>
  )
}

function KindToggle() {
  const kind = useGame((s) => s.preferredKind)
  const setKind = useGame((s) => s.setPreferredKind)
  return (
    <div style={{ display:'flex', gap:6 }}>
      <button className={`button ${kind === 'video' ? '' : 'secondary'}`} onClick={() => setKind('video')}>Video</button>
      <button className={`button ${kind === 'audio' ? '' : 'secondary'}`} onClick={() => setKind('audio')}>Audio</button>
    </div>
  )
}
