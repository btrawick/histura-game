import { useEffect, useRef, useState } from 'react'
import { starsReached } from '@/lib/scoring'


export default function TimerAndStars({ sec }: { sec: number }) {
const [prevStars, setPrevStars] = useState(0)
const stars = starsReached(sec)
const justPopped = useRef<number[]>([])


useEffect(() => {
if (stars > prevStars) {
const newOnes = Array.from({ length: stars - prevStars }, (_, i) => prevStars + i)
justPopped.current = newOnes
setTimeout(() => { justPopped.current = [] }, 350)
setPrevStars(stars)
}
}, [stars])


return (
<div className="row" style={{ alignItems:'center', justifyContent:'space-between' }}>
<div style={{ fontSize: 32, fontVariantNumeric:'tabular-nums' }}>{sec.toFixed(1)}s</div>
<div style={{ display:'flex', gap:8 }}>
{Array.from({ length: 5 }).map((_, i) => (
<img key={i} src="/icons/star.svg" className={`star ${i < stars ? 'active' : ''} ${justPopped.current.includes(i) ? 'pop' : ''}`} />
))}
</div>
</div>
)
}
