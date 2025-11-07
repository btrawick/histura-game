import { useEffect, useRef, useState } from 'react'

export function useRecorder(kind: 'audio' | 'video') {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const mediaRef = useRef<MediaStream | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const tickRef = useRef<number | null>(null)

  useEffect(() => () => stopClock(), [])

  function stopClock() {
    if (tickRef.current) cancelAnimationFrame(tickRef.current)
    tickRef.current = null
  }

  async function ensurePermission() {
    try {
      const stream = kind === 'video'
        ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRef.current = stream
      setPermission('granted')
      return stream
    } catch (e) {
      console.error(e)
      setPermission('denied')
      throw e
    }
  }

  async function start() {
    const stream = mediaRef.current ?? (await ensurePermission())
    chunksRef.current = []
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
    recRef.current = rec
    setRecording(true)
    const startedAt = performance.now()
    const loop = () => {
      setElapsed((performance.now() - startedAt) / 1000)
      tickRef.current = requestAnimationFrame(loop)
    }
    tickRef.current = requestAnimationFrame(loop)
    rec.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data)
    }
    rec.start(100)
  }

  async function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = recRef.current
      if (!rec) return resolve(null)
      rec.onstop = () => {
        stopClock()
        setRecording(false)
        const blob = new Blob(chunksRef.current, { type: rec.mimeType })
        chunksRef.current = []
        resolve(blob)
      }
      rec.stop()
    })
  }

  function attach(el: HTMLVideoElement | HTMLAudioElement | null) {
    if (!el || !mediaRef.current) return
    ;(el as any).srcObject = mediaRef.current
  }

  return { permission, recording, elapsed, start, stop, attach, ensurePermission }
}
