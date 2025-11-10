import AvatarInput from '@/components/AvatarInput'
import { sideLabels, useGame, Relationship } from '@/lib/store'
import { Link } from 'react-router-dom'


export default function Home() {
const { relationship, setRelationship, players } = useGame()
const reset = useGame((s) => s.resetGame)


function handleRelationshipChange(e: React.ChangeEvent<HTMLSelectElement>) {
setRelationship(e.target.value as Relationship)
}


return (
<div className="container">
<h1>Histura Game</h1>
<div className="card" style={{ marginBottom: 16 }}>
<div className="label">Relationship</div>
<select className="input" value={relationship} onChange={handleRelationshipChange}>
<option value="kid-parent">Kid ↔ Parent</option>
<option value="adultchild-parent">Adult Child ↔ Parent</option>
<option value="friend-friend">Friend ↔ Friend</option>
<option value="kid-grandparent">Kid ↔ Grandparent</option>
</select>
<p style={{ opacity:.8, marginTop:8 }}>Player roles adapt to the pairing: P1 is <b>{sideLabels[relationship].p1}</b>, P2 is <b>{sideLabels[relationship].p2}</b>.</p>
</div>


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
