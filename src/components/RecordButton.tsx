import { useEffect, useRef } from 'react'

export default function RecordButton({ recording, onStart, onStop }: { recording: boolean; onStart: () => void; onStop: () => void }) {
  const ref = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    function handleK(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        recording ? onStop() : onStart()
      }
    }
    window.addEventListener('keydown', handleK)
    return () => window.removeEventListener('keydown', handleK)
  }, [recording])

  return (
    <button className="button" ref={ref} onClick={recording ? onStop : onStart}>
      {recording ? 'Stop (Space)' : 'Record (Space)'}
    </button>
  )
}
