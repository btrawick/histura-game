import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import Home from '@/routes/Home'
import Play from '@/routes/Play'
import Playback from '@/routes/Playback'
import Settings from '@/routes/Settings'
import './styles/globals.css'

export default function App() {
  return (
    <div>
      <nav className="container">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/play">Play</NavLink>
        <NavLink to="/playback">Playback</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Outlet />
    </div>
  )
}
