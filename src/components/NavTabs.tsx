// src/components/NavTabs.tsx
import { Link, useLocation } from 'react-router-dom';

export default function NavTabs() {
  const { pathname } = useLocation();
  const is = (p: string) => pathname === p;
  return (
    <div className="tabs">
      <div className="tabs-inner">
        <Link to="/" className={`tab ${is('/') ? 'active' : ''}`}>Home</Link>
        <Link to="/play" className={`tab ${is('/play') ? 'active' : ''}`}>Play</Link>
        <Link to="/playback" className={`tab ${is('/playback') ? 'active' : ''}`}>Playback</Link>
        <Link to="/settings" className={`tab ${is('/settings') ? 'active' : ''}`}>Settings</Link>
      </div>
    </div>
  );
}
