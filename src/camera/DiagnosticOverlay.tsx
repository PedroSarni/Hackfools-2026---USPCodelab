import { useEffect, useRef } from 'react';
import type { VisionObservation } from './types';

interface DiagnosticOverlayProps {
  observation: VisionObservation | null;
  mirrored: boolean;
}

export function DiagnosticOverlay({ observation, mirrored }: DiagnosticOverlayProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!observation?.landmarks) return;

    context.fillStyle = 'rgba(196, 255, 99, 0.72)';
    for (let index = 0; index < observation.landmarks.length; index += 3) {
      const point = observation.landmarks[index];
      context.beginPath();
      context.arc(point.x * canvas.width, point.y * canvas.height, 1.25 * ratio, 0, Math.PI * 2);
      context.fill();
    }
  }, [observation]);

  return <canvas ref={canvasRef} className={`diagnostic-canvas ${mirrored ? 'is-mirrored' : ''}`} />;
}
