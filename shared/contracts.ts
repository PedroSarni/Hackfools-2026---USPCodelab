export const ATTENTION_STATUSES = [
  'screen',
  'down',
  'away',
  'absent',
  'uncertain',
] as const;

export type AttentionStatus = (typeof ATTENTION_STATUSES)[number];
export type AttentionSource = 'camera' | 'simulation';

export interface AttentionSignal {
  status: AttentionStatus;
  confidence: number;
  observedAt: number;
  stableForMs: number;
  calibrated: boolean;
  available: boolean;
  source: AttentionSource;
}

export interface CameraPreferences {
  mirrored: boolean;
  diagnostics: boolean;
  deviceId?: string;
}

export interface FredReaction {
  reactionId: string;
  mood: 'observing' | 'suspicious' | 'disappointed' | 'relieved';
  message: string;
  priority: number;
  durationMs: number;
  source: 'camera';
  delivery: 'pending-fred';
}

export interface AppInfo {
  version: string;
  implementedStages: readonly [2, 3];
  fredImplemented: false;
}

export interface MainBridge {
  openCamera(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
}

export interface CameraBridge {
  closeWindow(): Promise<void>;
  getPreferences(): Promise<CameraPreferences>;
  updatePreferences(patch: Partial<CameraPreferences>): Promise<CameraPreferences>;
  publishAttention(signal: AttentionSignal): void;
  onFredReaction(callback: (reaction: FredReaction) => void): () => void;
}

declare global {
  interface Window {
    baiStudyMain?: MainBridge;
    baiStudyCamera?: CameraBridge;
  }
}
