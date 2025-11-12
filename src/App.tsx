import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/routes/Home';
import Play from '@/routes/Play';
import Playback from '@/routes/Playback';
import Settings from '@/routes/Settings';
import AppHeader from '@/components/AppHeader';
import '@/styles/theme.css'; // ensure theme styles are active

export default function App() {
  return (
    <BrowserRouter>
      {/* Top navigation bar with theme toggle */}
      <AppHeader />

      {/* Main content area */}
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '16px 12px 48px',
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/playback" element={<Playback />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
