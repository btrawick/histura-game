// src/hooks/useRecorder.ts
import { useEffect, useRef, useState } from 'react';

export function useRecorder(kind: 'audio' | 'video') {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const mediaRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);
  const attachRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      stopClock();
      stopStream();
    };
  }, []);

  function stopClock() {
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    tickRef.current = null;
  }

  function stopStream() {
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }

  async function refreshDevices() {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const vids = devs.filter((d) => d.kind === 'videoinput');
      setVideoInputs(vids);
      if (vids.length && videoIndex === null) setVideoIndex(0);
    } catch {
      /* ignore */
    }
  }

  async function ensurePermission() {
    try {
      const constraints: MediaStreamConstraints = kind === 'video' ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRef.current = stream;
      setPermission('granted');
      await refreshDevices();
      return stream;
    } catch (e) {
      console.error(e);
      setPermission('denied');
      throw e;
    }
  }

  function attach(el: HTMLVideoElement | HTMLAudioElement | null) {
    attachRef.current = el;
    if (!el || !mediaRef.current) return;
    (el as any).srcObject = mediaRef.current;
  }

  async function start() {
    const have = mediaRef.current ?? (await ensurePermission());
    if (!have) return;

    // If video: rebuild stream to respect specific camera device if set
    if (kind === 'video') {
      const deviceId = videoInputs[videoIndex ?? 0]?.deviceId;
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
      });
      mediaRef.current = stream;
      if (attachRef.current) (attachRef.current as any).srcObject = stream;
    }

    chunksRef.current = [];

    const mimeType = pickMime();
    const options: MediaRecorderOptions | undefined = mimeType ? { mimeType } : undefined;

    const rec = new MediaRecorder(mediaRef.current!, options);
    recRef.current = rec;
    setRecording(true);

    const startedAt = performance.now();
    const loop = () => {
      setElapsed((performance.now() - startedAt) / 1000);
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);

    rec.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.start(100);
  }

  async function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = recRef.current;
      if (!rec) return resolve(null);
      rec.onstop = () => {
        stopClock();
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'application/octet-stream' });
        chunksRef.current = [];
        resolve(blob);
      };
      rec.stop();
    });
  }

  /** Cycle to the next available camera (when kind === 'video'). */
  async function cycleCamera() {
    if (kind !== 'video') return;
    if (recording) return; // avoid switching mid-recording
    if (!videoInputs.length) await refreshDevices();
    if (!videoInputs.length) return;

    const nextIdx = ((videoIndex ?? 0) + 1) % videoInputs.length;
    setVideoIndex(nextIdx);

    const deviceId = videoInputs[nextIdx]?.deviceId;
    if (deviceId) {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { deviceId: { exact: deviceId } },
      });
      mediaRef.current = stream;
      if (attachRef.current) (attachRef.current as any).srcObject = stream;
    }
  }

  return { permission, recording, elapsed, start, stop, attach, ensurePermission, cycleCamera };
}

function isTypeSupported(m: string): boolean {
  // Some browsers lack isTypeSupported or MediaRecorder
  const MR: any = (globalThis as any).MediaRecorder;
  return !!(MR && typeof MR.isTypeSupported === 'function' && MR.isTypeSupported(m));
}

function pickMime(): string | undefined {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'audio/webm;codecs=opus',
    'video/mp4', // may not be allowed/encodable by MediaRecorder in many browsers
    'audio/mp4',
  ];
  for (const c of candidates) {
    if (isTypeSupported(c)) return c;
  }
  return undefined;
}
