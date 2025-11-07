import { create } from 'zustand'
import { Player, SavedRecording } from '@/types'
import { Category, DEFAULT_CATEGORIES } from './questions'

interface GameState {
  players: { p1: Player; p2: Player }
  categories: Category[]
  preferredKind: 'audio' | 'video'
  recordings: SavedRecording[]
  setPlayer: (id: 'p1' | 'p2', patch: Partial<Player>) => void
  addScore: (id: 'p1' | 'p2', delta: number) => void
  setCategories: (cats: Category[]) => void
  setPreferredKind: (k: 'audio' | 'video') => void
  addRecording: (rec: SavedRecording) => void
  removeRecording: (id: string) => void
  resetGame: () => void
}

const defaultPlayer = (id: 'p1' | 'p2'): Player => ({ id, name: id.toUpperCase(), role: id === 'p1' ? 'kid' : 'adult', score: 0 })

export const useGame = create<GameState>((set) => ({
  players: { p1: defaultPlayer('p1'), p2: defaultPlayer('p2') },
  categories: DEFAULT_CATEGORIES,
  preferredKind: 'video',
  recordings: [],
  setPlayer: (id, patch) => set((s) => ({ players: { ...s.players, [id]: { ...s.players[id], ...patch } } })),
  addScore: (id, delta) => set((s) => ({ players: { ...s.players, [id]: { ...s.players[id], score: Math.max(0, s.players[id].score + delta) } } })),
  setCategories: (cats) => set({ categories: cats }),
  setPreferredKind: (k) => set({ preferredKind: k }),
  addRecording: (rec) => set((s) => ({ recordings: [rec, ...s.recordings] })),
  removeRecording: (rid) => set((s) => ({ recordings: s.recordings.filter((r) => r.meta.id !== rid) })),
  resetGame: () => set({ players: { p1: defaultPlayer('p1'), p2: defaultPlayer('p2') }, recordings: [] }),
}))
