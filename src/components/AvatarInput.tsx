import { useRef } from 'react'
import { useGame } from '@/lib/store'

export default function AvatarInput({ id }: { id: 'p1' | 'p2' }) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const player = useGame((s) => s.players[id])
  const setPlayer = useGame((s) => s.setPlayer)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await fToDataUrl(f)
    setPlayer(id, { avatarDataUrl: dataUrl })
  }

  return (
    <div className="card" style={{ display:'flex', gap:12, alignItems:'center' }}>
      <img src={player.avatarDataUrl || `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${player.name || id}`}
           alt={player.name} width={64} height={64} style={{ borderRadius:12 }} />
      <div style={{ flex:1 }}>
        <div className="label">Player {id.toUpperCase()}</div>
        <input className="input" placeholder={id.toUpperCase()} value={player.name}
               onChange={(e) => setPlayer(id, { name: e.target.value })} />
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <select className="input" value={player.role}
                  onChange={(e) => setPlayer(id, { role: e.target.value as any })}>
            <option value="kid">Kid</option>
            <option value="adult">Adult</option>
          </select>
          <button className="button secondary" onClick={() => fileRef.current?.click()}>Upload Avatar</button>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} hidden />
        </div>
      </div>
      <div style={{ fontWeight:700, fontSize:18 }}>Score: {player.score}</div>
    </div>
  )
}

async function fToDataUrl(file: File): Promise<string> {
  return new Promise((res) => {
    const reader = new FileReader()
    reader.onload = () => res(String(reader.result))
    reader.readAsDataURL(file)
  })
}
