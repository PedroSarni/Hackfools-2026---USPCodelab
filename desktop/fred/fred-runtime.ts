import type { BrowserWindow, Screen } from 'electron';
import type {
  FredMood, FredPositionIntent, FredReaction, FredSimulation, FredState, FredVoiceStatus,
} from '../../shared/contracts';
import { IPC } from '../../shared/events';
import { FredBehaviorController } from '../behavior/fred-behavior-controller';
import { FredIdleController } from '../behavior/fred-idle-controller';
import { FredPositionController } from '../behavior/fred-position-controller';
import type { SettingsService } from '../services/settings-service';
import { SpeechService } from '../speech/speech-service';
import { createFredWindow } from '../windows/fred-window';

export class FredRuntime {
  private window: BrowserWindow | null = null;
  private behavior: FredBehaviorController;
  private idle?: FredIdleController;
  private position?: FredPositionController;
  private speech?: SpeechService;
  private speechId = 0;
  private quitting = false;
  private state: FredState;
  private readonly displayChanged = (): void => { this.position?.request(this.state.intent, true); };

  constructor(
    private readonly settings: SettingsService,
    private readonly screen: Screen,
    private readonly nativeWayland: boolean,
    private readonly getRelatedWindows: () => Array<BrowserWindow | null>,
  ) {
    this.state = {
      visible: true,
      mood: 'idle',
      message: 'Freddy na área. Abre o PDF que eu fico de olho.',
      source: 'idle',
      activity: 'normal',
      intent: 'discreet',
      voiceEnabled: settings.getFredPreferences().voiceEnabled,
      voiceStatus: 'idle',
      graphics: nativeWayland ? 'Wayland' : process.platform === 'linux' ? 'X11 / XWayland' : 'Nativo',
      overlaySupported: !nativeWayland,
      positionStatus: nativeWayland ? 'limited' : 'pending',
    };
    this.behavior = new FredBehaviorController((reaction, intent) => this.applyReaction(reaction, intent));
  }

  async start(onCreated: (window: BrowserWindow) => void): Promise<BrowserWindow> {
    this.state.visible = false;
    this.window = await createFredWindow(this.nativeWayland, onCreated, false);
    this.position = new FredPositionController(
      this.screen,
      this.window,
      () => this.getRelatedWindows()
        .filter((window): window is BrowserWindow => Boolean(
          window && !window.isDestroyed() && window.isVisible() && !window.isMinimized(),
        ))
        .map((window) => window.getBounds()),
      !this.nativeWayland,
      (status) => { this.state.positionStatus = status; this.broadcast(); },
    );
    this.speech = new SpeechService(
      (audio) => { if (this.state.voiceEnabled && this.state.visible) this.window?.webContents.send(IPC.fred.audio, audio); },
      (status) => { this.state.voiceStatus = status; this.broadcast(); },
    );
    this.idle = new FredIdleController(
      () => this.state.visible && ['idle', 'observing'].includes(this.state.mood) &&
        ['idle', 'manual'].includes(this.state.source) && this.state.voiceStatus === 'idle',
      (scrolling) => { this.state.activity = scrolling ? 'scrolling' : 'normal'; this.broadcast(); },
      () => this.behavior.caughtScrolling(),
    );
    this.window.on('close', (event) => {
      if (this.quitting) return;
      event.preventDefault();
      this.hide();
    });
    this.window.on('blur', () => this.ensurePresence());
    this.window.on('always-on-top-changed', (_event, enabled) => { if (!enabled) this.ensurePresence(); });
    this.screen.on('display-added', this.displayChanged);
    this.screen.on('display-removed', this.displayChanged);
    this.screen.on('display-metrics-changed', this.displayChanged);
    this.position.request('discreet', true);
    this.broadcast();
    return this.window;
  }

  getWindow(): BrowserWindow | null { return this.window; }
  getState(): FredState { return { ...this.state }; }

  show(): void {
    if (!this.window || this.window.isDestroyed()) return;
    const wasVisible = this.state.visible;
    this.state.visible = true;
    this.window.showInactive();
    this.ensurePresence();
    this.position?.request(this.state.intent, true);
    this.idle?.reset();
    this.broadcast();
    if (!wasVisible) this.speakCurrent();
  }

  hide(): void {
    this.state.visible = false;
    this.window?.hide();
    this.stopVoice();
    this.idle?.reset();
    this.broadcast();
  }

  simulate(event: FredSimulation): { accepted: boolean } { return this.behavior.simulate(event); }
  preview(mood: FredMood): void { this.behavior.preview(mood); }
  reactToCamera(reaction: FredReaction): void { this.behavior.camera(reaction); }
  hover(inside: boolean): void { this.idle?.hover(inside); }

  async setVoiceEnabled(enabled: boolean): Promise<void> {
    this.state.voiceEnabled = enabled;
    if (!enabled) this.stopVoice();
    await this.settings.updateFredPreferences({ voiceEnabled: enabled });
    this.broadcast();
  }

  testVoice(): void {
    if (!this.state.voiceEnabled) {
      this.state.voiceEnabled = true;
      void this.settings.updateFredPreferences({ voiceEnabled: true });
    }
    this.speakCurrent();
  }
  stopVoice(): void {
    this.speechId = 0;
    this.speech?.cancel();
    this.window?.webContents.send(IPC.fred.audio, { stop: true });
  }

  voicePlayback(id: number, status: 'playing' | 'ended' | 'error'): void {
    if (id !== this.speechId) return;
    this.state.voiceStatus = status === 'ended' ? 'idle' : status;
    this.broadcast();
  }

  refreshPosition(): void { this.position?.request(this.state.intent); }

  dispose(): void {
    this.quitting = true;
    this.idle?.dispose();
    this.position?.dispose();
    this.behavior.dispose();
    this.speech?.dispose();
    this.screen.removeListener('display-added', this.displayChanged);
    this.screen.removeListener('display-removed', this.displayChanged);
    this.screen.removeListener('display-metrics-changed', this.displayChanged);
    this.window?.destroy();
  }

  private applyReaction(reaction: FredReaction, intent: FredPositionIntent): void {
    this.idle?.reset();
    Object.assign(this.state, {
      mood: reaction.mood,
      message: reaction.message,
      source: reaction.source,
      intent,
      activity: 'normal',
    });
    this.show();
    this.position?.request(intent);
    this.broadcast();
    if (reaction.source !== 'idle') this.speakCurrent();
  }

  private speakCurrent(): void {
    this.stopVoice();
    if (this.state.voiceEnabled && this.state.visible) this.speechId = this.speech?.speak(this.state.message) ?? 0;
  }

  private ensurePresence(): void {
    if (this.quitting || !this.state.visible || !this.window || this.window.isDestroyed() || this.nativeWayland) return;
    this.window.setAlwaysOnTop(true, 'floating');
    if (this.window.isVisible()) this.window.moveTop();
  }

  private broadcast(): void {
    for (const window of [this.window, ...this.getRelatedWindows()]) {
      if (window && !window.isDestroyed()) window.webContents.send(IPC.fred.state, this.getState());
    }
  }
}
