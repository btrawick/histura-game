export const thresholds = [30, 45, 60, 90] as const

export function pointsForDuration(sec: number): number {
  if (sec <= 0) return 0
  if (sec < 30) return 1
  if (sec < 45) return 2
  if (sec < 60) return 3
  if (sec <= 90) return 4
  return 5
}

export function starsReached(sec: number): number {
  // 1 star at <30, 2 at 30–45, 3 at 45–60, 4 at 60–90, 5 at >90
  return pointsForDuration(sec)
}
