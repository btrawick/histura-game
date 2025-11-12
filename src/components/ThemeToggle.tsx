// src/components/ThemeToggle.tsx
import { useEffect } from 'react';
import { useGame } from '@/lib/store';

export default function ThemeToggle() {
  const theme = useGame((s) => s.theme);
  const setTheme = useGame((s) => s.setTheme);

  // Ensure <html data-theme="..."> is correct on mount/theme change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button
      className="button secondary"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{ padding: '8px 10px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
    >
      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
