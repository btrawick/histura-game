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

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function pickMime(kind: Kind) {
  const ios = typeof navigator !== 'undefined' && isIOS();

  const videoCandidates = ios
    ? [
        // iOS: prefer MP4 first if supported
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        // fallback
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
    : [
        // Others: webm first
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        // fallback
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
      ];

  const audioCandidates = ios
    ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];

  const candidates = kind === 'video' ? videoCandidates : audioCandidates;

  for (const t of candidates) {
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
    } catch {}
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

  // NEW: toggle only between front/back
  const facingRef = useRef<'user' | 'environment'>('user');

  // Optional fallback: list of deviceIds (only used if facingMode fails)
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
    // @ts-ignore
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

  const getVideoConstraints = useCallback(
    (override?: { deviceId?: string; facingMode?: 'user' | 'environment' }) => {
      // 720p + 30fps cap
      const base: any = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      };
      if (override?.deviceId) base.deviceId = { exact: override.deviceId };
      if (override?.facingMode) base.facingMode = { ideal: override.facingMode };
      return base as MediaTrackConstraints;
    },
    []
  );

  const ensurePermission = useCallback(async () => {
    if (streamRef.current) return;

    // Try to learn devices for fallback (not required for front/back toggling)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoDeviceIdsRef.current = devices.filter((d) => d.kind === 'videoinput').map((d) => d.deviceId);
      currentVideoIndexRef.current = 0;
    } catch {
      videoDeviceIdsRef.current = [];
      currentVideoIndexRef.current = 0;
    }

    const wantVideo = kind === 'video';

    const constraints: MediaStreamConstraints = {
      audio: true,
      video: wantVideo ? getVideoConstraints({ facingMode: facingRef.current }) : false,
    };

    const s = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.current = s;

    if (mediaElRef.current) {
      // @ts-ignore
      mediaElRef.current.srcObject = s;
    }
  }, [kind, getVideoConstraints]);

  const buildRecorder = useCallback(() => {
    const s = streamRef.current;
    if (!s) throw new Error('No media stream available');

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

    if (recorderRef.current && recorderRef.current.state === 'recording') return;

    chunksRef.current = [];
    const mr = buildRecorder();
    mr.start(1000);
  }, [ensurePermission, buildRecorder]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const mr = recorderRef.current;
    if (!mr) return null;

    if (mr.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        mr.addEventListener('stop', () => resolve(), { once: true });
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

  const replaceVideoTrack = useCallback(async (newTrack: MediaStreamTrack) => {
    const s = streamRef.current;
    if (!s) return;

    // stop + remove old video tracks
    s.getVideoTracks().forEach((t) => {
      try {
        t.stop();
      } catch {}
      try {
        s.removeTrack(t);
      } catch {}
    });

    s.addTrack(newTrack);

    if (mediaElRef.current) {
      // @ts-ignore
      mediaElRef.current.srcObject = s;
    }
  }, []);

  const cycleCamera = useCallback(async () => {
    if (kind !== 'video') return;
    const s = streamRef.current;
    if (!s) return;

    // Cannot switch reliably while recording — some browsers glitch.
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      // If you want: you can toast "Stop recording to switch camera"
      return;
    }

    // Toggle front/back
    const nextFacing: 'user' | 'environment' = facingRef.current === 'user' ? 'environment' : 'user';

    // First attempt: facingMode toggle (best for iPhone)
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: getVideoConstraints({ facingMode: nextFacing }),
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      facingRef.current = nextFacing;
      await replaceVideoTrack(newVideoTrack);

      // Stop the temporary stream container (track is already moved/used)
      newStream.getTracks().forEach((t) => {
        if (t !== newVideoTrack) {
          try {
            t.stop();
          } catch {}
        }
      });

      return;
    } catch {
      // fall through to deviceId cycling
    }

    // Fallback: cycle deviceIds (less reliable on iOS, but better than nothing)
    try {
      if (!videoDeviceIdsRef.current.length) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoDeviceIdsRef.current = devices.filter((d) => d.kind === 'videoinput').map((d) => d.deviceId);
        currentVideoIndexRef.current = 0;
      }
      if (videoDeviceIdsRef.current.length < 2) return;

      currentVideoIndexRef.current =
        (currentVideoIndexRef.current + 1) % videoDeviceIdsRef.current.length;
      const deviceId = videoDeviceIdsRef.current[currentVideoIndexRef.current];

      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: getVideoConstraints({ deviceId }),
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      await replaceVideoTrack(newVideoTrack);
    } catch {
      // give up silently
    }
  }, [kind, getVideoConstraints, replaceVideoTrack]);

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
