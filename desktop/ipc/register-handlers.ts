import { app, ipcMain, shell, type BrowserWindow } from 'electron';
import type { AppInfo, ProcrastinationMilestone, ProcrastinationSessionState } from '../../shared/contracts';
import { IPC } from '../../shared/events';
import { AttentionReactionController } from '../behavior/attention-reaction-controller';
import type { SettingsService } from '../services/settings-service';
import type { ReelsService } from '../services/reels-service';
import { assertTrustedSender, validateAttentionSignal, validatePreferencePatch } from './validate-message';

const STUDY_PLAYLIST_URL = 'https://www.youtube.com/watch?v=4elA1yVc5oo&list=PLxI8Can9yAHeZfF4HwiVmv4D6n3acKLER';

interface HandlerDependencies {
  settings: SettingsService;
  reels: ReelsService;
  trustedWebContentsIds: Set<number>;
  getCameraWindow(): BrowserWindow | null;
  getInstagramWindow(): BrowserWindow | null;
  openCameraWindow(): Promise<void>;
  openInstagramWindow(): Promise<void>;
}

export function registerHandlers(dependencies: HandlerDependencies): () => void {
  const reactions = new AttentionReactionController();
  const procrastinationState: ProcrastinationSessionState = {
    warningShown: false,
    limitReached: false,
  };
  const channels = [
    IPC.main.openCamera,
    IPC.main.openInstagram,
    IPC.main.getAppInfo,
    IPC.camera.close,
    IPC.camera.getPreferences,
    IPC.camera.updatePreferences,
    IPC.instagram.close,
    IPC.instagram.getReels,
    IPC.instagram.getProcrastinationState,
    IPC.instagram.recordProcrastinationMilestone,
    IPC.instagram.startStudying,
  ];

  ipcMain.handle(IPC.main.openCamera, async (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    await dependencies.openCameraWindow();
  });

  ipcMain.handle(IPC.main.openInstagram, async (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    await dependencies.openInstagramWindow();
  });

  ipcMain.handle(IPC.main.getAppInfo, (event): AppInfo => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return { version: app.getVersion(), implementedStages: [2, 3], fredImplemented: false };
  });

  ipcMain.handle(IPC.camera.close, (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    dependencies.getCameraWindow()?.close();
  });

  ipcMain.handle(IPC.camera.getPreferences, (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return dependencies.settings.getCameraPreferences();
  });

  ipcMain.handle(IPC.camera.updatePreferences, async (event, value: unknown) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return dependencies.settings.updateCameraPreferences(validatePreferencePatch(value));
  });

  ipcMain.handle(IPC.instagram.close, (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    dependencies.getInstagramWindow()?.close();
  });

  ipcMain.handle(IPC.instagram.getReels, async (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return dependencies.reels.list();
  });

  ipcMain.handle(IPC.instagram.getProcrastinationState, (event): ProcrastinationSessionState => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return { ...procrastinationState };
  });

  ipcMain.handle(IPC.instagram.recordProcrastinationMilestone, (event, value: unknown): ProcrastinationSessionState => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    if (value !== 'warning' && value !== 'limit') {
      throw new TypeError('Marco de procrastinação inválido.');
    }
    const milestone: ProcrastinationMilestone = value;
    procrastinationState.warningShown = true;
    if (milestone === 'limit') procrastinationState.limitReached = true;
    console.info('[Reels/anti-procrastination] marco registrado na sessão', {
      milestone,
      state: procrastinationState,
    });
    return { ...procrastinationState };
  });

  ipcMain.handle(IPC.instagram.startStudying, async (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    console.info('[Reels/anti-procrastination] abrindo playlist no navegador padrão', {
      url: STUDY_PLAYLIST_URL,
    });
    try {
      await shell.openExternal(STUDY_PLAYLIST_URL);
      console.info('[Reels/anti-procrastination] playlist aberta com sucesso', {
        url: STUDY_PLAYLIST_URL,
      });
      dependencies.getInstagramWindow()?.close();
    } catch (error) {
      console.error('[Reels/anti-procrastination] falha ao abrir playlist', {
        url: STUDY_PLAYLIST_URL,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      });
      throw error;
    }
  });

  const attentionListener = (event: Electron.IpcMainEvent, value: unknown): void => {
    try {
      assertTrustedSender(event, dependencies.trustedWebContentsIds);
      const signal = validateAttentionSignal(value);
      const reaction = reactions.consume(signal);
      if (reaction) dependencies.getCameraWindow()?.webContents.send(IPC.fred.reaction, reaction);
    } catch (error) {
      console.warn('Sinal de atenção rejeitado.', error);
    }
  };
  ipcMain.on(IPC.camera.attentionUpdated, attentionListener);

  return () => {
    for (const channel of channels) ipcMain.removeHandler(channel);
    ipcMain.removeListener(IPC.camera.attentionUpdated, attentionListener);
  };
}
