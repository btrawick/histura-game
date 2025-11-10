import { useEffect, useRef, useState } from 'react';
import { starsReached } from '@/lib/scoring';
import { useGame } from '@/lib/store';

export default function TimerAndStars({ sec }: { sec: number }) {
  const scale = useGame((s) => s.starScale);
  const [prevStars, setPrevStars] = useState(0);
  const stars = starsReached(sec, scale);
  const justPopped = useRef<number[]>([]);

  useEffect(() => {
    if (stars > prevStars) {
      const newOnes = Array.from({ length: stars - prevStars }, (_, i) => prevStars + i);
      justPopped.current = newOnes;
      setTimeout(() => { justPopped.current = []; }, 350);
      setPrevStars(stars);
    }
  }, [stars]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 32, fontVariantNumeric: 'tabular-nums' }}>{sec.toFixed(1)}s</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <img key={i} src="/icons/star.svg" className={`star ${i < stars ? 'active' : ''} ${justPopped.current.includes(i) ? 'pop' : ''}`} />
        ))}
      </div>
    </div>
  );
}

