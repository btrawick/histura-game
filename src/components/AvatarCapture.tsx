// src/components/AvatarCapture.tsx
import { useEffect, useRef, useState } from 'react';

export default function AvatarCapture({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) (videoRef.current as any).srcObject = s;
      } catch (e) {
        setError('Cannot access camera.');
      }
    })();
    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function takeSnapshot() {
    const video = videoRef.current;
    if (!video) return;
    const size = Math.min(video.videoWidth, video.videoHeight) || 512;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    // center-crop to square
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    onSave(dataUrl);
  }

  return (
    <div className="overlay">
      <div className="overlay-card" style={{ width: 520, maxWidth: '95vw' }}>
        <div className="label">Take Profile Photo</div>
        <div className="card" style={{ background: '#0b1220', borderRadius: 12, padding: 12 }}>
          {error ? (
            <div style={{ color: '#ff6b6b' }}>{error}</div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8 }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
          <button className="button" onClick={takeSnapshot} disabled={!stream}>
            Capture
          </button>
          <button
            className="button secondary"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </button>
        </div>
        <p style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>
          Tip: Hold the device at arm’s length, good light, then tap <b>Capture</b>.
        </p>
      </div>
    </div>
  );
}
