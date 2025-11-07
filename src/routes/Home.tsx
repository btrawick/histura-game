import AvatarInput from '@/components/AvatarInput'
import { useGame } from '@/lib/store'
import { Link } from 'react-router-dom'

export default function Home() {
  const reset = useGame((s) => s.resetGame)
  return (
    <div className="container">
      <h1>Histura Game</h1>
      <p>Set up your players, then head to <span className="kbd">Play</span>.</p>
      <div className="grid" style={{ marginTop: 16 }}>
        <AvatarInput id="p1" />
        <AvatarInput id="p2" />
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <Link to="/play" className="button">Go to Play</Link>
        <button className="button secondary" onClick={reset}>Reset Game</button>
      </div>
    </div>
  )
}
