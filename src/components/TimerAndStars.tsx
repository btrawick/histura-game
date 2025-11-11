// src/components/TimerAndStars.tsx
import { useGame } from '@/lib/store';
import { pointsForDuration } from '@/lib/scoring';

export default function TimerAndStars({ sec }: { sec: number }) {
  const starScale = useGame((s) => s.starScale);
  const pts = pointsForDuration(sec, starScale); // 0..5
  const stars = Math.max(0, Math.min(5, pts));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.9 }}>
        {format(sec)}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < stars} />
        ))}
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={filled ? '#FFC94A' : 'none'}
        stroke={filled ? '#F5B400' : 'rgba(255,255,255,0.35)'}
        strokeWidth="1.2"
      />
    </svg>
  );
}

function format(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

