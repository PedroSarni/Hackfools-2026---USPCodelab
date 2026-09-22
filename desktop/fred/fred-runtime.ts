import type { BrowserWindow } from 'electron';
import type {
  FredMood, FredPositionIntent, FredReaction, FredSimulation, FredState,
} from '../../shared/contracts';
import { IPC } from '../../shared/events';
import { FredBehaviorController } from '../behavior/fred-behavior-controller';
import { FredIdleController } from '../behavior/fred-idle-controller';
import type { SettingsService } from '../services/settings-service';
import { SpeechService } from '../speech/speech-service';

export class FredRuntime {
  private behavior: FredBehaviorController;
  private idle?: FredIdleController;
  private speech?: SpeechService;
  private speechId = 0;
  private quitting = false;
  private state: FredState;

  constructor(
    private readonly settings: SettingsService,
    nativeWayland: boolean,
    private readonly getRelatedWindows: () => Array<BrowserWindow | null>,
  ) {
    this.state = {
      visible: true,
      mood: 'idle',
      message: 'Olá! Eu sou o Freddy, vou te ajudar a largar a procrastinação.',
      source: 'idle',
      activity: 'normal',
      intent: 'discreet',
      voiceEnabled: true,
      voiceStatus: 'idle',
      graphics: nativeWayland ? 'Wayland' : process.platform === 'linux' ? 'X11 / XWayland' : 'Nativo',
      overlaySupported: !nativeWayland,
      positionStatus: nativeWayland ? 'limited' : 'pending',
    };
    this.behavior = new FredBehaviorController((reaction, intent) => this.applyReaction(reaction, intent));
  }

  async start(): Promise<void> {
    this.state.visible = false;
    await this.settings.updateFredPreferences({ voiceEnabled: true });
    this.speech = new SpeechService(
      (audio) => { if (this.state.voiceEnabled && this.state.visible) this.getRelatedWindows()[0]?.webContents.send(IPC.fred.audio, audio); },
      (status) => { this.state.voiceStatus = status; this.broadcast(); },
    );
    this.idle = new FredIdleController(
      () => this.state.visible && this.state.voiceStatus === 'idle',
      (scrolling) => { this.state.activity = scrolling ? 'scrolling' : 'normal'; this.broadcast(); },
      () => this.behavior.caughtScrolling(),
    );
    this.broadcast();
  }

  getState(): FredState { return { ...this.state }; }

  show(): void {
    if (this.quitting) return;
    const wasVisible = this.state.visible;
    this.state.visible = true;
    this.idle?.reset();
    this.broadcast();
    if (!wasVisible) this.speakCurrent();
  }

  hide(): void {
    this.state.visible = false;
    this.stopVoice();
    this.idle?.reset();
    this.broadcast();
  }

  simulate(event: FredSimulation): { accepted: boolean } { return this.behavior.simulate(event); }
  preview(mood: FredMood): void { this.behavior.preview(mood); }
  reactToCamera(reaction: FredReaction): void { this.behavior.camera(reaction); }
  hover(inside: boolean): void { this.idle?.hover(inside); }
  say(message: string, complete = false): void { this.behavior.say(message, complete); }

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
    this.getRelatedWindows()[0]?.webContents.send(IPC.fred.audio, { stop: true });
  }

  voicePlayback(id: number, status: 'playing' | 'ended' | 'error'): void {
    if (id !== this.speechId) return;
    this.state.voiceStatus = status === 'ended' ? 'idle' : status;
    this.broadcast();
  }


  retire(): void {
    this.hide();
    this.dispose();
  }

  dispose(): void {
    this.quitting = true;
    this.idle?.dispose();
    this.behavior.dispose();
    this.speech?.dispose();
  }

  private applyReaction(reaction: FredReaction, intent: FredPositionIntent): void {
    if (this.quitting) return;
    this.idle?.reset();
    Object.assign(this.state, {
      mood: reaction.mood,
      message: reaction.message,
      source: reaction.source,
      intent,
      activity: 'normal',
    });
    this.show();
    this.broadcast();
    if (reaction.source !== 'idle') this.speakCurrent();
  }

  private speakCurrent(): void {
    this.stopVoice();
    if (this.state.voiceEnabled && this.state.visible) this.speechId = this.speech?.speak(this.state.message) ?? 0;
  }

  private broadcast(): void {
    for (const window of this.getRelatedWindows()) {
      if (window && !window.isDestroyed()) window.webContents.send(IPC.fred.state, this.getState());
    }
  }
}
