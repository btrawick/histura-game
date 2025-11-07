export type PlayerRole = 'kid' | 'adult'

export interface Player {
  id: 'p1' | 'p2'
  name: string
  role: PlayerRole
  avatarDataUrl?: string
  score: number
}

export interface RecordingMeta {
  id: string
  playerId: Player['id']
  questionId: string
  category: string
  startedAt: number
  stoppedAt: number
  durationSec: number
  points: number
  kind: 'audio' | 'video'
  mimeType: string
}

export interface SavedRecording {
  meta: RecordingMeta
  blobKey: string // key in IndexedDB
}
