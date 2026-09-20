import type { AttentionSignal, AttentionStatus } from '../../shared/contracts';

export interface PoseMetrics {
  pitch: number;
  yaw: number;
  roll: number;
  faceWidth: number;
}

export interface DiagnosticPoint {
  x: number;
  y: number;
}

export interface VisionObservation {
  detected: boolean;
  quality: number;
  capturedAt: number;
  processingMs: number;
  metrics?: PoseMetrics;
  landmarks?: DiagnosticPoint[];
}

export interface CalibrationProfile {
  front: PoseMetrics;
  downPitchDelta: number;
  sideYawThreshold: number;
  createdAt: number;
}

export interface AttentionEstimate {
  signal: AttentionSignal;
  candidate: AttentionStatus;
  candidateForMs: number;
}

export type VisionWorkerRequest =
  | { type: 'init'; wasmBaseUrl: string; modelUrl: string }
  | { type: 'frame'; bitmap: ImageBitmap; capturedAt: number; diagnostics: boolean }
  | { type: 'dispose' };

export type VisionWorkerResponse =
  | { type: 'initialized' }
  | { type: 'result'; observation: VisionObservation }
  | { type: 'error'; message: string; fatal: boolean };
