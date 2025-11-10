import { useEffect, useRef, useState } from 'react'
import { useGame } from '@/lib/store'


export default function Scoreboard() {
const { players } = useGame()
const [bump, setBump] = useState<{p1:boolean;p2:boolean}>({p1:false,p2:false})
const prev = useRef<{p1:number;p2:number}>({p1: players.p1.score, p2: players.p2.score})


useEffect(() => {
(['p1','p2'] as const).forEach((id) => {
if (players[id].score !== prev.current[id]) {
setBump((b) => ({...b, [id]: true}))
setTimeout(() => setBump((b) => ({...b, [id]: false})), 600)
prev.current[id] = players[id].score
}
})
}, [players.p1.score, players.p2.score])


return (
<div className="row">
{(['p1','p2'] as const).map((id) => (
<div key={id} className="card" style={{ flex:1 }}>
<div className="label">{players[id].role.toUpperCase()}</div>
<div style={{ display:'flex', alignItems:'center', gap:10 }}>
<img src={players[id].avatarDataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${players[id].name || id}`}
width={48} height={48} style={{ borderRadius:10 }} />
<div style={{ fontWeight:700 }}>{players[id].name || id.toUpperCase()}</div>
<div className={` ${bump[id] ? 'score-bump' : ''}`} style={{ marginLeft:'auto', fontWeight:800 }}>⭐ {players[id].score}</div>
</div>
</div>
))}
</div>
)
}
