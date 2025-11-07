import { useGame } from '@/lib/store'

export default function Scoreboard() {
  const { players } = useGame()
  return (
    <div className="row">
      {(['p1','p2'] as const).map((id) => (
        <div key={id} className="card" style={{ flex:1 }}>
          <div className="label">{players[id].role.toUpperCase()}</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src={players[id].avatarDataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${players[id].name || id}`}
                 width={48} height={48} style={{ borderRadius:10 }} />
            <div style={{ fontWeight:700 }}>{players[id].name || id.toUpperCase()}</div>
            <div style={{ marginLeft:'auto', fontWeight:800 }}>⭐ {players[id].score}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
