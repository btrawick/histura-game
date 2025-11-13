import { useEffect, useRef, useState } from 'react';

export default function AvatarCapture({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
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
          // If we navigated away before it arrived
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        const v = videoRef.current;
        if (v) {
          (v as any).srcObject = s;
          v.onloadedmetadata = () => {
            setReady(true);
            v.play().catch(() => {});
          };
        }
      } catch (e) {
        setError('Cannot access camera.');
      }
    })();

    return () => {
      // Cleanup on unmount
      stopStream();
    };
  }, []);

  function stopStream() {
    const v = videoRef.current;
    if (v) {
      try { v.pause(); } catch {}
      try { (v as any).srcObject = null; } catch {}
      v.removeAttribute('src'); // iOS Safari quirk
      v.load?.();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try { t.stop(); } catch {}
      });
      streamRef.current = null;
    }
    setReady(false);
  }

  function handleCancel() {
    stopStream();
    onCancel();
  }

  function handleSave() {
    const v = videoRef.current;
    if (!v) return;

    // Snapshot square crop
    const size = Math.min(v.videoWidth || 512, v.videoHeight || 512) || 512;
    const sx = ((v.videoWidth || size) - size) / 2;
    const sy = ((v.videoHeight || size) - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(v, sx, sy, size, size, 0, 0, 512, 512);
    const dataUrl = canvas.toDataURL('image/png', 0.92);

    // Tear down stream BEFORE returning control
    stopStream();
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
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', borderRadius: 8 }}
            />
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
          <button className="button" onClick={handleSave} disabled={!ready || !!error}>
            Capture
          </button>
          <button className="button secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

