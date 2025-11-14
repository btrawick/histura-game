// src/lib/store.ts
import { create } from 'zustand';
import type { Player, SavedRecording, GameSession, Relationship } from '@/types';
export type { Relationship } from '@/types';

export type Kind = 'audio' | 'video';

export const sideLabels: Record<Relationship, { p1: string; p2: string }> = {
  'kid-parent': { p1: 'Kid', p2: 'Parent' },
  'adultchild-parent': { p1: 'Adult Child', p2: 'Parent' },
  'friend-friend': { p1: 'Friend A', p2: 'Friend B' },
  'kid-grandparent': { p1: 'Kid', p2: 'Grandparent' },
  'kid-kid': { p1: 'Kid A', p2: 'Kid B' },
  'sibling-sibling': { p1: 'Sibling A', p2: 'Sibling B' },
};

interface GameState {
  relationship: Relationship;
  players: { p1: Player; p2: Player };
  preferredKind: Kind;
  recordings: SavedRecording[];
  highScore: number;

  starScale: number;
  setStarScale: (n: number) => void;

  currentGameId: string;
  games: GameSession[];
  startNewGame: () => void;

  setRelationship: (r: Relationship) => void;
  setPlayer: (id: 'p1' | 'p2', patch: Partial<Player>) => void;
  swapPlayers: () => void;

  addScore: (id: 'p1' | 'p2', delta: number) => void;
  setPreferredKind: (k: Kind) => void;
  addRecording: (rec: SavedRecording) => void;
  removeRecording: (id: string) => void;
  resetGame: () => void;
  resetScores: () => void;
}

const defaultPlayer = (id: 'p1' | 'p2', label: string): Player => ({
  id,
  name: label,
  role: label.toLowerCase(),
  score: 0,
});

const newGameId = () => crypto.randomUUID();

export const useGame = create<GameState>((set, get) => {
  const rel: Relationship = 'kid-parent';
  const initialGame: GameSession = {
    id: newGameId(),
    startedAt: Date.now(),
    relationship: rel,
    p1Name: sideLabels[rel].p1,
    p2Name: sideLabels[rel].p2,
  };

  return {
    relationship: rel,
    players: {
      p1: defaultPlayer('p1', sideLabels[rel].p1),
      p2: defaultPlayer('p2', sideLabels[rel].p2),
    },
    preferredKind: 'video',
    recordings: [],
    highScore: 0,

    starScale: 1,
    setStarScale: (n) => set({ starScale: Math.min(2, Math.max(0.5, n)) }),

    currentGameId: initialGame.id,
    games: [initialGame],
    startNewGame: () =>
      set((s) => {
        const g: GameSession = {
          id: newGameId(),
          startedAt: Date.now(),
          relationship: s.relationship,
          p1Name: s.players.p1.name || sideLabels[s.relationship].p1,
          p2Name: s.players.p2.name || sideLabels[s.relationship].p2,
        };
        return {
          currentGameId: g.id,
          games: [g, ...s.games],
          highScore: 0,
          players: {
            p1: { ...s.players.p1, score: 0 },
            p2: { ...s.players.p2, score: 0 },
          },
        };
      }),

    setRelationship: (r) =>
      set((s) => {
        const prevLabels = sideLabels[s.relationship];
        const newLabels = sideLabels[r];

        const p1NameIsDefault =
          !s.players.p1.name || s.players.p1.name === prevLabels.p1;
        const p2NameIsDefault =
          !s.players.p2.name || s.players.p2.name === prevLabels.p2;

        return {
          relationship: r,
          players: {
            p1: {
              ...s.players.p1,
              role: newLabels.p1.toLowerCase(),
              // if name was just the old default, update it to the new label
              name: p1NameIsDefault ? newLabels.p1 : s.players.p1.name,
            },
            p2: {
              ...s.players.p2,
              role: newLabels.p2.toLowerCase(),
              name: p2NameIsDefault ? newLabels.p2 : s.players.p2.name,
            },
          },
        };
      }),

    setPlayer: (id, patch) =>
      set((s) => ({
        players: { ...s.players, [id]: { ...s.players[id], ...patch } },
      })),

    swapPlayers: () =>
      set((s) => ({
        players: {
          p1: { ...s.players.p2, id: 'p1' },
          p2: { ...s.players.p1, id: 'p2' },
        },
      })),

    addScore: (id, delta) =>
      set((s) => {
        const newScore = Math.max(0, s.players[id].score + delta);
        const newHigh = Math.max(s.highScore, newScore);
        return {
          players: {
            ...s.players,
            [id]: { ...s.players[id], score: newScore },
          },
          highScore: newHigh,
        };
      }),

    setPreferredKind: (k) => set({ preferredKind: k }),

    addRecording: (rec) =>
      set((s) => ({ recordings: [rec, ...s.recordings] })),

    removeRecording: (rid) =>
      set((s) => ({
        recordings: s.recordings.filter((r) => r.meta.id !== rid),
      })),

    resetGame: () =>
      set((s) => ({
        players: {
          p1: defaultPlayer('p1', sideLabels[s.relationship].p1),
          p2: defaultPlayer('p2', sideLabels[s.relationship].p2),
        },
        recordings: [],
        highScore: 0,
      })),

    resetScores: () =>
      set((s) => ({
        players: {
          p1: { ...s.players.p1, score: 0 },
          p2: { ...s.players.p2, score: 0 },
        },
        highScore: 0,
      })),
  };
});
