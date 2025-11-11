// src/routes/Play.tsx
// (same imports)
import { useGame } from '@/lib/store';
import type { SavedRecording } from '@/types';
// ... other imports unchanged

// inside component (unchanged up top) …
  const { players, relationship, preferredKind, addScore, addRecording, highScore, starScale, resetScores, resetGame, currentGameId } = useGame();

// … inside handleStop() meta object:
    const meta: SavedRecording['meta'] = {
      id,
      gameId: currentGameId, // NEW
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

// … in the render, replace ONLY the label+buttons row under TimerAndStars with this,
// i.e., remove the Video/Audio buttons from the main card:
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <RecordButton recording={rec.recording} onStart={rec.start} onStop={handleStop} />
          {/* Kind toggle removed from main card */}
        </div>

// Keep the overlay camera switch as-is.
