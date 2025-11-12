import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

export default function AppHeader() {
  const { pathname } = useLocation();
  const is = (p: string) => pathname === p;

  return (
    <div className="app-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
      <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Histura Game</div>

      <nav style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
        <HeaderLink to="/" active={is('/')}>Home</HeaderLink>
        <HeaderLink to="/play" active={is('/play')}>Play</HeaderLink>
        <HeaderLink to="/playback" active={is('/playback')}>Playback</HeaderLink>
        <HeaderLink to="/settings" active={is('/settings')}>Settings</HeaderLink>
      </nav>

      <div style={{ marginLeft: 'auto' }}>
        <ThemeToggle />
      </div>
    </div>
  );
}

function HeaderLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        padding: '6px 10px',
        borderRadius: 8,
        textDecoration: 'none',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        background: active ? 'var(--btn-alt)' : 'transparent',
        color: 'var(--header-text)',
      }}
    >
      {children}
    </Link>
  );
}

