export const ATTENTION_STATUSES = [
  'screen',
  'down',
  'away',
  'absent',
  'uncertain',
] as const;
export const FRED_MOODS = ['idle', 'observing', 'happy', 'angry', 'disappointed', 'resting'] as const;
export const FRED_SIMULATIONS = ['study', 'distraction', 'absent', 'complete', 'rest', 'return'] as const;

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
  mood: FredMood;
  message: string;
  priority: number;
  durationMs: number;
  source: 'camera' | 'simulation' | 'hover' | 'manual' | 'idle';
  delivery: 'fred';
}

export type FredMood = (typeof FRED_MOODS)[number];
export type FredPositionIntent = 'discreet' | 'attention' | 'celebrate' | 'rest';
export type FredSimulation = (typeof FRED_SIMULATIONS)[number];
export type FredVoiceStatus = 'idle' | 'generating' | 'ready' | 'playing' | 'error';

export interface FredState {
  visible: boolean;
  mood: FredMood;
  message: string;
  source: FredReaction['source'];
  activity: 'normal' | 'scrolling';
  intent: FredPositionIntent;
  voiceEnabled: boolean;
  voiceStatus: FredVoiceStatus;
  graphics: string;
  overlaySupported: boolean;
  positionStatus: 'pending' | 'active' | 'limited';
}

export interface FredAudio {
  id: number;
  pcm: ArrayBuffer;
  sampleRate: number;
}

export interface FredPreferences { voiceEnabled: boolean; }

export interface AppInfo {
  version: string;
  implementedStages: readonly [1, 2, 3];
  fredImplemented: true;
}

export interface ReelAsset {
  id: string;
  fileName: string;
  displayName: string;
  url: string;
}

export type ProcrastinationMilestone = 'warning' | 'limit';

export interface ProcrastinationSessionState {
  warningShown: boolean;
  limitReached: boolean;
}

export interface InstagramBridge {
  closeWindow(): Promise<void>;
  getReels(): Promise<ReelAsset[]>;
  getProcrastinationState(): Promise<ProcrastinationSessionState>;
  recordProcrastinationMilestone(milestone: ProcrastinationMilestone): Promise<ProcrastinationSessionState>;
  startStudying(): Promise<void>;
}


export interface MainBridge {
  materialOpened(id: string): Promise<void>;
  skinSelected(id: string): Promise<void>;
  getSession(): Promise<import('./freddy-session').FreddySessionState>;
  startBuddy(): Promise<import('./freddy-session').FreddySessionState>;
  dismissBuddy(): Promise<import('./freddy-session').FreddySessionState>;
  finishBuddy(): Promise<import('./freddy-session').FreddySessionState>;
  openInstagram(): Promise<void>;
  onNavigate(callback: (target: string) => void): () => void;
  getAcademy(): Promise<import('./academy').AcademyState>;
  updateAcademy(action: import('./academy').AcademyAction): Promise<import('./academy').AcademyState>;
  openCamera(): Promise<void>;
  getAppInfo(): Promise<AppInfo>;
  getFredState(): Promise<FredState>;
  showFred(): Promise<void>;
  hideFred(): Promise<void>;
  simulateFred(event: FredSimulation): Promise<{ accepted: boolean }>;
  previewFred(mood: FredMood): Promise<void>;
  setFredVoiceEnabled(enabled: boolean): Promise<void>;
  testFredVoice(): Promise<void>;
  stopFredVoice(): Promise<void>;
  quitApp(): Promise<void>;
  onFredState(callback: (state: FredState) => void): () => void;
}

export interface FredBridge {
  getState(): Promise<FredState>;
  openMain(): Promise<void>;
  hide(): Promise<void>;
  hover(inside: boolean): void;
  reportVoicePlayback(id: number, status: 'playing' | 'ended' | 'error'): void;
  onState(callback: (state: FredState) => void): () => void;
  onAudio(callback: (audio: FredAudio | { stop: true }) => void): () => void;
}

export interface CameraBridge {
  minimizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  getPreferences(): Promise<CameraPreferences>;
  updatePreferences(patch: Partial<CameraPreferences>): Promise<CameraPreferences>;
  publishAttention(signal: AttentionSignal): void;
}

declare global {
  interface Window {
    baiStudyInstagram?: InstagramBridge;
    baiStudyMain?: MainBridge;
    baiStudyCamera?: CameraBridge;
    baiStudyFred?: FredBridge;
  }
}
