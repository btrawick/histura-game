import { create } from 'zustand'
import { Player, SavedRecording } from '@/types'


export type Relationship = 'kid-parent' | 'adultchild-parent' | 'friend-friend' | 'kid-grandparent'


export const sideLabels: Record<Relationship, { p1: string; p2: string }> = {
'kid-parent': { p1: 'Kid', p2: 'Parent' },
'adultchild-parent': { p1: 'Adult Child', p2: 'Parent' },
'friend-friend': { p1: 'Friend A', p2: 'Friend B' },
'kid-grandparent': { p1: 'Kid', p2: 'Grandparent' },
}


interface GameState {
relationship: Relationship
players: { p1: Player; p2: Player }
preferredKind: 'audio' | 'video'
recordings: SavedRecording[]
highScore: number
setRelationship: (r: Relationship) => void
setPlayer: (id: 'p1' | 'p2', patch: Partial<Player>) => void
addScore: (id: 'p1' | 'p2', delta: number) => void
setPreferredKind: (k: 'audio' | 'video') => void
addRecording: (rec: SavedRecording) => void
removeRecording: (id: string) => void
resetGame: () => void
resetScores: () => void
}


const defaultPlayer = (id: 'p1' | 'p2', label: string): Player => ({ id, name: label, role: label.toLowerCase() as any, score: 0 })


export const useGame = create<GameState>((set, get) => ({
relationship: 'kid-parent',
players: { p1: defaultPlayer('p1', sideLabels['kid-parent'].p1), p2: defaultPlayer('p2', sideLabels['kid-parent'].p2) },
preferredKind: 'video',
recordings: [],
highScore: 0,
setRelationship: (r) => set((s) => ({
relationship: r,
players: {
p1: { ...s.players.p1, role: sideLabels[r].p1.toLowerCase() as any, name: s.players.p1.name || sideLabels[r].p1 },
p2: { ...s.players.p2, role: sideLabels[r].p2.toLowerCase() as any, name: s.players.p2.name || sideLabels[r].p2 },
}
})),
setPlayer: (id, patch) => set((s) => ({ players: { ...s.players, [id]: { ...s.players[id], ...patch } } })),
addScore: (id, delta) => set((s) => {
const newScore = Math.max(0, s.players[id].score + delta)
const newHigh = Math.max(s.highScore, newScore)
return { players: { ...s.players, [id]: { ...s.players[id], score: newScore } }, highScore: newHigh }
}),
setPreferredKind: (k) => set({ preferredKind: k }),
addRecording: (rec) => set((s) => ({ recordings: [rec, ...s.recordings] })),
removeRecording: (rid) => set((s) => ({ recordings: s.recordings.filter((r) => r.meta.id !== rid) })),
resetGame: () => set((s) => ({
players: { p1: defaultPlayer('p1', sideLabels[s.relationship].p1), p2: defaultPlayer('p2', sideLabels[s.relationship].p2) },
recordings: [], highScore: 0
})),
resetScores: () => set((s) => ({
players: { p1: { ...s.players.p1, score: 0 }, p2: { ...s.players.p2, score: 0 } }, highScore: 0
})),
}))
