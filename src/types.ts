// src/types.ts
export type Relationship = 'kid-parent' | 'adultchild-parent' | 'friend-friend' | 'kid-grandparent';

export interface Player {
  id: 'p1' | 'p2';
  name: string;
  role: string; // e.g., 'kid', 'parent', etc.
  avatarDataUrl?: string;
  score: number;
}

export interface SavedRecording {
  meta: {
    id: string;
    gameId: string;          // which game this belongs to
    playerId: 'p1' | 'p2';
    questionId: string;
    category: string;
    startedAt: number;
    stoppedAt: number;
    durationSec: number;
    points: number;
    kind: 'audio' | 'video';
    mimeType: string;
  };
  blobKey: string;           // key in IndexedDB
}

export interface GameSession {
  id: string;
  startedAt: number;
  relationship: Relationship;
  p1Name: string;
  p2Name: string;
}
