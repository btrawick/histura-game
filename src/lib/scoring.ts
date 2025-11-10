export const BASE_THRESHOLDS = [30, 45, 60, 90] as const;

/** scale < 1 → stars come sooner; scale > 1 → stars take longer */
export function pointsForDuration(sec: number, scale = 1): number {
  if (sec <= 0) return 0;
  const [t1, t2, t3, t4] = BASE_THRESHOLDS.map((t) => t * scale);
  if (sec < t1) return 1;
  if (sec < t2) return 2;
  if (sec < t3) return 3;
  if (sec <= t4) return 4;
  return 5;
}

export function starsReached(sec: number, scale = 1): number {
  return pointsForDuration(sec, scale);
}
