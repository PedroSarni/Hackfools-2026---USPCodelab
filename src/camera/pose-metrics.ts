import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { DiagnosticPoint, PoseMetrics, VisionObservation } from './types';

const LANDMARKS = {
  forehead: 10,
  chin: 152,
  nose: 1,
  leftCheek: 234,
  rightCheek: 454,
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,
} as const;

export function observationFromLandmarks(
  landmarks: NormalizedLandmark[] | undefined,
  capturedAt: number,
  processingMs: number,
  includeDiagnostics: boolean,
): VisionObservation {
  if (!landmarks || landmarks.length < 455) {
    return { detected: false, quality: 0, capturedAt, processingMs };
  }

  const metrics = calculatePoseMetrics(landmarks);
  const quality = calculateSignalQuality(landmarks, metrics.faceWidth);
  const diagnosticLandmarks = includeDiagnostics
    ? landmarks.map(({ x, y }): DiagnosticPoint => ({ x, y }))
    : undefined;
  return {
    detected: true,
    quality,
    capturedAt,
    processingMs,
    metrics,
    ...(diagnosticLandmarks ? { landmarks: diagnosticLandmarks } : {}),
  };
}

export function calculatePoseMetrics(landmarks: NormalizedLandmark[]): PoseMetrics {
  const point = (index: number): NormalizedLandmark => landmarks[index];
  const average = (...indices: number[]): { x: number; y: number } => ({
    x: indices.reduce((sum, index) => sum + point(index).x, 0) / indices.length,
    y: indices.reduce((sum, index) => sum + point(index).y, 0) / indices.length,
  });

  const leftEye = average(LANDMARKS.leftEyeOuter, LANDMARKS.leftEyeInner);
  const rightEye = average(LANDMARKS.rightEyeInner, LANDMARKS.rightEyeOuter);
  const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const nose = point(LANDMARKS.nose);
  const leftCheek = point(LANDMARKS.leftCheek);
  const rightCheek = point(LANDMARKS.rightCheek);
  const faceWidth = Math.max(Math.abs(rightCheek.x - leftCheek.x), 0.001);
  const faceHeight = Math.max(Math.abs(point(LANDMARKS.chin).y - point(LANDMARKS.forehead).y), 0.001);
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;

  return {
    pitch: (nose.y - eyeCenter.y) / faceHeight,
    yaw: (nose.x - faceCenterX) / faceWidth,
    roll: (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI,
    faceWidth,
  };
}

export function calculateSignalQuality(
  landmarks: NormalizedLandmark[],
  faceWidth: number,
): number {
  const nose = landmarks[LANDMARKS.nose];
  const leftEye = landmarks[LANDMARKS.leftEyeOuter];
  const rightEye = landmarks[LANDMARKS.rightEyeOuter];
  const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  const sizeScore = clamp(faceWidth / 0.22);
  const centerDistance = Math.hypot(nose.x - 0.5, nose.y - 0.48);
  const centerScore = clamp(1 - centerDistance / 0.55);
  const geometryScore = clamp(eyeDistance / 0.12);
  return round(clamp(sizeScore * 0.45 + centerScore * 0.35 + geometryScore * 0.2));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
