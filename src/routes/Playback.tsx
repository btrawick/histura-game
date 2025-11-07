import { useEffect, useState } from 'react'
import { useGame } from '@/lib/store'
import { loadBlob, deleteBlob, exportAll } from '@/lib/storage'
import { SavedRecording } from '@/types'

export default function Playback() {
  const { recordings, removeRecording, players } = useGame()
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    ;(async () => {
      const map: Record<string, string> = {}
      for (const r of recordings) {
        const b = await loadBlob(r.blobKey)
        if (!b) continue
        map[r.meta.id] = URL.createObjectURL(b)
      }
      setUrls(map)
    })()
    return () => Object.values(urls).forEach((u) => URL.revokeObjectURL(u))
  }, [recordings.length])

  async function handleDelete(r: SavedRecording) {
    await deleteBlob(r.blobKey)
    removeRecording(r.meta.id)
  }

  async function handleExport() {
    const zipBlob = await exportAll(recordings)
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'histura-game-export.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <h1>Playback & Scores</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="card" style={{ flex:1 }}><h3>{players.p1.name}</h3><b>Score: {players.p1.score}</b></div>
        <div className="card" style={{ flex:1 }}><h3>{players.p2.name}</h3><b>Score: {players.p2.score}</b></div>
        <button className="button" onClick={handleExport}>Export ZIP</button>
      </div>

      <div className="grid">
        {recordings.map((r) => (
          <div key={r.meta.id} className="card">
            <div className="label">{r.meta.category} · {r.meta.questionId} · {r.meta.points} pts</div>
            {r.meta.kind === 'video' ? (
              <video src={urls[r.meta.id]} controls />
            ) : (
              <audio src={urls[r.meta.id]} controls />
            )}
            <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8 }}>
              <div>Duration: {r.meta.durationSec.toFixed(1)}s</div>
              <button className="button secondary" onClick={() => handleDelete(r)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
