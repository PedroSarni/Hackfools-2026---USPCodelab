import { useEffect, useRef, useState } from 'react';
import { removeGreen, removeSideBars } from './video-matte';

export function MatteVideo({ src, green = false, sideInset = 0, loop = false, muted = true, label, onEnded }: {
  src: string; green?: boolean; sideInset?: number; loop?: boolean; muted?: boolean; label: string; onEnded?(): void;
}): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const play = (): void => {
    void videoRef.current?.play().then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true));
  };
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    if (!video || !canvas || !context) { setError(true); return; }
    setError(false);
    let frame = 0;
    const draw = (): void => {
      try {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          const inset = Math.round(video.videoWidth * Math.max(0, Math.min(0.45, sideInset)));
          const croppedWidth = video.videoWidth - 2 * inset;
          const width = Math.min(croppedWidth, green ? 960 : 400);
          const height = Math.round(video.videoHeight * width / croppedWidth);
          if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
          context.clearRect(0, 0, width, height);
          context.drawImage(video, inset, 0, croppedWidth, video.videoHeight, 0, 0, width, height);
          const pixels = context.getImageData(0, 0, width, height);
          removeSideBars(pixels.data, width, height);
          if (green) removeGreen(pixels.data);
          context.putImageData(pixels, 0, 0);
        }
        if (!video.ended) frame = video.requestVideoFrameCallback(draw);
      } catch { setError(true); video.pause(); }
    };
    frame = video.requestVideoFrameCallback(draw);
    play();
    return () => { video.cancelVideoFrameCallback(frame); video.pause(); };
  }, [src, green, sideInset]);
  return <span className="matte-video">
    <video ref={videoRef} src={src} loop={loop} muted={muted} playsInline preload="auto" onEnded={onEnded} onError={() => setError(true)} />
    <canvas ref={canvasRef} role="img" aria-label={label} />
    {needsPlay && !error && onEnded && <button onClick={play}>Reproduzir vídeo</button>}
    {error && <span role="alert">Não foi possível reproduzir o vídeo.{onEnded && <button onClick={onEnded}>Concluir e liberar Instagram</button>}</span>}
  </span>;
}
