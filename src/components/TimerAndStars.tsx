import { thresholds, starsReached } from '@/lib/scoring'

export default function TimerAndStars({ sec }: { sec: number }) {
  const stars = starsReached(sec)
  return (
    <div className="row" style={{ alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ fontSize: 32, fontVariantNumeric:'tabular-nums' }}>{sec.toFixed(1)}s</div>
      <div style={{ display:'flex', gap:8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <img key={i} src="/icons/star.svg" className={`star ${i < stars ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  )
}
