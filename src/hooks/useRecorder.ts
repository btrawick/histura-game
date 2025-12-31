// src/hooks/useRecorder.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Kind = 'audio' | 'video';

type RecorderApi = {
  recording: boolean;
  elapsed: number; // seconds
  ensurePermission: () => Promise<void>;
  attach: (el: HTMLVideoElement | HTMLAudioElement) => void;
  start: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  cycleCamera: () => Promise<void>;
};

function pickMime(kind: Kind) {
  // Prefer modern webm first; iOS Safari support is inconsistent, but we pick what the browser supports.
  const candidates =
    kind === 'video'
      ? [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
          'video/mp4',
        ]
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];

  for (const t of candidates) {
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      // ignore
    }
  }
  return '';
}

export function useRecorder(kind: Kind): RecorderApi {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaElRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTsRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const videoDeviceIdsRef = useRef<string[]>([]);
  const currentVideoIndexRef = useRef<number>(0);

  const mimeType = useMemo(() => pickMime(kind), [kind]);

  const stopTick = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startTick = () => {
    stopTick();
    tickRef.current = window.setInterval(() => {
      if (!startTsRef.current) return;
      const sec = (Date.now() - startTsRef.current) / 1000;
      setElapsed(sec);
    }, 150);
  };

  const attach = useCallback((el: HTMLVideoElement | HTMLAudioElement) => {
    mediaElRef.current = el;
    const s = streamRef.current;
    if (!s) return;

    // @ts-ignore - srcObject exists on HTMLMediaElement
    el.srcObject = s;
  }, []);

  const stopTracks = (s: MediaStream | null) => {
    if (!s) return;
    s.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {}
    });
  };

  const ensurePermission = useCallback(async () => {
    // If we already have a stream, we’re good.
    if (streamRef.current) return;

    // Collect camera devices for cycling
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDeviceIdsRef.current = devices.filter((d) => d.kind === 'videoinput').map((d) => d.deviceId);
      currentVideoIndexRef.current = 0;
    } catch {
      videoDeviceIdsRef.current = [];
      currentVideoIndexRef.current = 0;
    }

    const wantVideo = kind === 'video';

    // 720p constraints (ideal); some devices will negotiate down.
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: wantVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          }
        : false,
    };

    const s = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = s;

    // Attach to current element if present
    if (mediaElRef.current) {
      // @ts-ignore
      mediaElRef.current.srcObject = s;
    }
  }, [kind]);

  const buildRecorder = useCallback(() => {
    const s = streamRef.current;
    if (!s) throw new Error('No media stream available');

    // IMPORTANT: bitrate control here (3 Mbps video).
    const opts: MediaRecorderOptions = {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: kind === 'video' ? 3_000_000 : undefined,
      audioBitsPerSecond: 96_000,
    };

    const mr = new MediaRecorder(s, opts);
    recorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstart = () => {
      startTsRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      startTick();
    };
    mr.onstop = () => {
      stopTick();
      setRecording(false);
    };

    return mr;
  }, [kind, mimeType]);

  const start = useCallback(async () => {
    await ensurePermission();

    // If already recording, do nothing
    if (recorderRef.current && recorderRef.current.state === 'recording') return;

    chunksRef.current = [];
    const mr = buildRecorder();

    // Timeslice keeps memory lower for long recordings.
    // 1000ms is a good compromise.
    mr.start(1000);
  }, [ensurePermission, buildRecorder]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const mr = recorderRef.current;
    if (!mr) return null;

    if (mr.state === 'inactive') {
      // If stopped already, still try to assemble what we have.
      if (!chunksRef.current.length) return null;
    } else {
      await new Promise<void>((resolve) => {
        const onStop = () => resolve();
        mr.addEventListener('stop', onStop, { once: true });
        try {
          mr.stop();
        } catch {
          resolve();
        }
      });
    }

    const parts = chunksRef.current;
    chunksRef.current = [];

    const type =
      (mimeType && mimeType.split(';')[0]) ||
      (kind === 'video' ? 'video/webm' : 'audio/webm');

    const blob = new Blob(parts, { type });

    return blob.size ? blob : null;
  }, [kind, mimeType]);

  const cycleCamera = useCallback(async () => {
    if (kind !== 'video') return;

    // If we can’t enumerate devices, do nothing.
    if (!videoDeviceIdsRef.current.length) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDeviceIdsRef.current = devices.filter((d) => d.kind === 'videoinput').map((d) => d.deviceId);
      } catch {
        return;
      }
    }
    if (videoDeviceIdsRef.current.length < 2) return;

    currentVideoIndexRef.current =
      (currentVideoIndexRef.current + 1) % videoDeviceIdsRef.current.length;
    const deviceId = videoDeviceIdsRef.current[currentVideoIndexRef.current];

    const oldStream = streamRef.current;
    if (!oldStream) return;

    // Keep existing audio track; replace only video track
    const audioTracks = oldStream.getAudioTracks();

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
    });

    const newVideoTrack = newStream.getVideoTracks()[0];
    if (!newVideoTrack) return;

    // Stop old video tracks
    oldStream.getVideoTracks().forEach((t) => {
      try {
        t.stop();
      } catch {}
      oldStream.removeTrack(t);
    });

    oldStream.addTrack(newVideoTrack);

    // Ensure audio tracks are still present
    audioTracks.forEach((t) => {
      if (!oldStream.getAudioTracks().includes(t)) oldStream.addTrack(t);
    });

    // Update attached element
    if (mediaElRef.current) {
      // @ts-ignore
      mediaElRef.current.srcObject = oldStream;
    }
  }, [kind]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTick();
      try {
        recorderRef.current?.stop();
      } catch {}
      recorderRef.current = null;
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    recording,
    elapsed,
    ensurePermission,
    attach,
    start,
    stop,
    cycleCamera,
  };
}
