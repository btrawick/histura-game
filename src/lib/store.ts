// top imports
import { create } from 'zustand';
import type { Player, SavedRecording, GameSession, Relationship } from '@/types';
export type { Relationship } from '@/types';

// ⬇️ add this type
export type ThemeMode = 'dark' | 'light';

export const useGame = create<GameState>((set, get) => {
  // ...existing init above

  return {
    // ...existing state

    // ⬇️ add theme state (default from OS, overridden by localStorage if set)
    theme: ((): ThemeMode => {
      const saved = (localStorage.getItem('histura_theme') as ThemeMode | null);
      if (saved === 'dark' || saved === 'light') return saved;
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    })(),
    setTheme: (mode: ThemeMode) =>
      set(() => {
        localStorage.setItem('histura_theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
        return { theme: mode };
      }),

    // ...rest unchanged
  };
});

// ⬇️ extend GameState interface (place near your GameState definition)
interface GameState {
  // ...existing
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}
