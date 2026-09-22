import {
  balanceOf,
  ensureJupiterSchedule,
  FREDDY_DISMISS_PRICE,
  initialAcademy,
  reduceAcademy,
  type AcademyState,
} from '../shared/academy';
import type {
  AttentionSignal,
  CameraPreferences,
  FredMood,
  FredSimulation,
  FredState,
  ProcrastinationMilestone,
  ProcrastinationSessionState,
  ReelAsset,
} from '../shared/contracts';
import { canDismissFreddy, sessionReels, type FreddyPhase, type FreddySessionState } from '../shared/freddy-session';

const ACADEMY_KEY = 'foco-total:web-academy';
const PHASE_KEY = 'foco-total:web-phase';
const CAMERA_KEY = 'foco-total:web-camera';
const PROCRASTINATION_KEY = 'foco-total:web-procrastination';
const NAVIGATE_EVENT = 'foco-total:web-navigate';

const REEL_FILES = [
  'reels01.mp4',
  'reels02.mp4',
  'reels03.mp4',
  'reels04.mp4',
  'reels05.mp4',
  'reels07.mp4',
  'reels09.mp4',
  'reels10.mp4',
] as const;

let memoryAcademy = initialAcademy();
let memoryPhase: FreddyPhase = 'waiting';
let memoryCamera: CameraPreferences = { mirrored: true, diagnostics: false };
let memoryProcrastination: ProcrastinationSessionState = { warningShown: false, limitReached: false };

let fredState: FredState = {
  visible: true,
  mood: 'idle',
  message: 'Olá! Eu sou o Freddy, vou te ajudar a largar a procrastinação.',
  source: 'idle',
  activity: 'normal',
  intent: 'discreet',
  voiceEnabled: false,
  voiceStatus: 'idle',
  graphics: 'Navegador',
  overlaySupported: false,
  positionStatus: 'limited',
};

const fredListeners = new Set<(state: FredState) => void>();

function loadJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A demonstração continua em memória quando o armazenamento está bloqueado.
  }
}

function readAcademy(): AcademyState {
  const candidate = loadJson<AcademyState>(ACADEMY_KEY, memoryAcademy);
  try {
    if (candidate.version !== 1 || !Array.isArray(candidate.missions) || !Array.isArray(candidate.transactions)) {
      throw new Error('Estado acadêmico inválido.');
    }
    memoryAcademy = ensureJupiterSchedule(candidate);
  } catch {
    memoryAcademy = initialAcademy();
  }
  return structuredClone(memoryAcademy);
}

function writeAcademy(state: AcademyState): AcademyState {
  memoryAcademy = structuredClone(state);
  saveJson(ACADEMY_KEY, memoryAcademy);
  return structuredClone(memoryAcademy);
}

function readPhase(): FreddyPhase {
  const stored = loadJson<FreddyPhase>(PHASE_KEY, memoryPhase);
  memoryPhase = stored === 'active' || stored === 'waiting' ? stored : 'waiting';
  return memoryPhase;
}

function writePhase(phase: FreddyPhase): void {
  memoryPhase = phase;
  saveJson(PHASE_KEY, phase);
}

function sessionState(): FreddySessionState {
  const academy = readAcademy();
  const phase = readPhase();
  const tasksCompleted = canDismissFreddy(academy);
  const balance = balanceOf(academy);
  return {
    phase,
    tasksCompleted,
    balance,
    canDismiss: phase === 'active' && (tasksCompleted || balance >= FREDDY_DISMISS_PRICE),
  };
}

function updateFred(patch: Partial<FredState>): void {
  fredState = { ...fredState, ...patch };
  const snapshot = { ...fredState };
  for (const listener of fredListeners) listener(snapshot);
}

function navigate(target: 'desktop' | 'foco' | 'instagram'): void {
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: target }));
}

function readProcrastination(): ProcrastinationSessionState {
  memoryProcrastination = loadJson(PROCRASTINATION_KEY, memoryProcrastination);
  return { ...memoryProcrastination };
}

function reelAssets(): ReelAsset[] {
  return REEL_FILES.map((fileName) => ({
    id: `web-${fileName}`,
    fileName,
    displayName: fileName.replace(/\.mp4$/i, '').replace(/[-_]+/g, ' '),
    url: new URL(`./reels/${fileName}`, window.location.href).href,
  }));
}

function openCameraWindow(): void {
  const cameraUrl = new URL('./camera.html', window.location.href).href;
  window.open(cameraUrl, 'foco-total-camera', 'popup,width=430,height=650');
}

function installMainBridge(): void {
  window.baiStudyMain = {
    async materialOpened() {
      updateFred({ visible: true, mood: 'observing', message: 'Material aberto. Freddy está de olho.' });
    },
    async skinSelected() {
      updateFred({ visible: true, mood: 'happy', message: 'Visual novo, cobrança acadêmica igual.' });
    },
    async getSession() {
      return sessionState();
    },
    async startBuddy() {
      writePhase('active');
      updateFred({ visible: true, mood: 'idle', message: 'Foco Total instalado. Agora não tem mais desculpa.' });
      return sessionState();
    },
    async dismissBuddy() {
      const academy = readAcademy();
      if (!canDismissFreddy(academy)) writeAcademy(reduceAcademy(academy, { type: 'freddy.dismiss.buy' }));
      writePhase('dying');
      memoryProcrastination = { warningShown: false, limitReached: false };
      saveJson(PROCRASTINATION_KEY, memoryProcrastination);
      updateFred({ visible: false });
      return { ...sessionState(), phase: 'dying' };
    },
    async finishBuddy() {
      writePhase('retired');
      return { ...sessionState(), phase: 'retired' };
    },
    async openInstagram() {
      navigate('instagram');
    },
    onNavigate(callback) {
      const listener = (event: Event): void => callback((event as CustomEvent<string>).detail);
      window.addEventListener(NAVIGATE_EVENT, listener);
      return () => window.removeEventListener(NAVIGATE_EVENT, listener);
    },
    async getAcademy() {
      return readAcademy();
    },
    async updateAcademy(action) {
      const next = writeAcademy(reduceAcademy(readAcademy(), action));
      if (action.type === 'mission.complete') {
        updateFred({ visible: true, mood: 'happy', message: 'Atividade concluída! Mais uma para a coleção.' });
      }
      return next;
    },
    async openCamera() {
      openCameraWindow();
    },
    async getAppInfo() {
      return { version: '0.1.0-web', implementedStages: [1, 2, 3], fredImplemented: true };
    },
    async getFredState() {
      return { ...fredState };
    },
    async showFred() {
      updateFred({ visible: true });
    },
    async hideFred() {
      updateFred({ visible: false });
    },
    async simulateFred(event: FredSimulation) {
      const moods: Record<FredSimulation, FredMood> = {
        study: 'observing',
        distraction: 'angry',
        absent: 'disappointed',
        complete: 'happy',
        rest: 'resting',
        return: 'idle',
      };
      updateFred({ mood: moods[event], visible: true, source: 'simulation' });
      return { accepted: true };
    },
    async previewFred(mood: FredMood) {
      updateFred({ mood, visible: true });
    },
    async setFredVoiceEnabled(enabled: boolean) {
      updateFred({ voiceEnabled: enabled });
    },
    async testFredVoice() {},
    async stopFredVoice() {},
    async quitApp() {
      navigate('desktop');
    },
    onFredState(callback) {
      fredListeners.add(callback);
      return () => fredListeners.delete(callback);
    },
  };
}

function installInstagramBridge(): void {
  window.baiStudyInstagram = {
    async closeWindow() {
      navigate('desktop');
    },
    async getReels() {
      return sessionReels(reelAssets(), readPhase());
    },
    async getProcrastinationState() {
      return readProcrastination();
    },
    async recordProcrastinationMilestone(milestone: ProcrastinationMilestone) {
      memoryProcrastination = {
        warningShown: true,
        limitReached: memoryProcrastination.limitReached || milestone === 'limit',
      };
      saveJson(PROCRASTINATION_KEY, memoryProcrastination);
      return { ...memoryProcrastination };
    },
    async startStudying() {
      navigate('foco');
    },
  };
}

function installFredBridge(): void {
  window.baiStudyFred = {
    async getState() {
      return { ...fredState };
    },
    async openMain() {
      window.opener?.focus();
    },
    async hide() {
      updateFred({ visible: false });
    },
    hover() {},
    reportVoicePlayback() {},
    onState(callback) {
      fredListeners.add(callback);
      return () => fredListeners.delete(callback);
    },
    onAudio() {
      return () => undefined;
    },
  };
}

function installCameraBridge(): void {
  window.baiStudyCamera = {
    async minimizeWindow() {
      window.blur();
      window.opener?.focus();
    },
    async closeWindow() {
      window.close();
    },
    async getPreferences() {
      memoryCamera = loadJson(CAMERA_KEY, memoryCamera);
      return { ...memoryCamera };
    },
    async updatePreferences(patch: Partial<CameraPreferences>) {
      memoryCamera = { ...memoryCamera, ...patch };
      saveJson(CAMERA_KEY, memoryCamera);
      return { ...memoryCamera };
    },
    publishAttention(signal: AttentionSignal) {
      if (signal.status === 'away' || signal.status === 'absent') {
        updateFred({ mood: 'disappointed', message: 'Freddy percebeu que você desviou da tela.' });
      }
    },
  };
}

export function installBrowserBridges(): void {
  if (window.baiStudyMain) return;
  installMainBridge();
  installInstagramBridge();
  installFredBridge();
  installCameraBridge();
}
