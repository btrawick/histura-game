import { useEffect, useRef, useState } from 'react'
</div>
</div>


{overlay.show && (
<div className="overlay">
<div className="overlay-card">
<div className="label">Next Turn</div>
<div style={{ fontWeight:800, fontSize:22 }}>{players[overlay.next].name}</div>
<div className="count">{overlay.count}</div>
</div>
</div>
)}


{showSummary && lastPair.length === 0 && (
<RoundSummary />
)}
</div>
)
}


function KindToggle() {
const kind = useGame((s) => s.preferredKind)
const setKind = useGame((s) => s.setPreferredKind)
return (
<div style={{ display:'flex', gap:6 }}>
<button className={`button ${kind === 'video' ? '' : 'secondary'}`} onClick={() => setKind('video')}>Video</button>
<button className={`button ${kind === 'audio' ? '' : 'secondary'}`} onClick={() => setKind('audio')}>Audio</button>
</div>
)
}


function RoundSummary() {
const { recordings, players } = useGame()
const recent = recordings.slice(0, 2) // last pair
if (recent.length < 2) return null
const p1 = recent.find((r) => r.meta.playerId === 'p1')!
const p2 = recent.find((r) => r.meta.playerId === 'p2')!
const winner = p1.meta.points === p2.meta.points ? 'Tie' : (p1.meta.points > p2.meta.points ? players.p1.name : players.p2.name)
const longest = p1.meta.durationSec === p2.meta.durationSec ? 'Tie' : (p1.meta.durationSec > p2.meta.durationSec ? players.p1.name : players.p2.name)
return (
<div className="overlay">
<div className="overlay-card">
<div className="label">Round Summary</div>
<div style={{ fontSize:18, marginTop:6 }}>Winner: <b>{winner}</b></div>
<div>Best Answer: <b>{Math.max(p1.meta.points, p2.meta.points)} pts</b></div>
<div>Longest: <b>{longest}</b></div>
</div>
</div>
)
}
