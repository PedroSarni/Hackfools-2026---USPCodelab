import { app, ipcMain, type BrowserWindow } from 'electron';
import type { AppInfo } from '../../shared/contracts';
import { IPC } from '../../shared/events';
import { AttentionReactionController } from '../behavior/attention-reaction-controller';
import type { SettingsService } from '../services/settings-service';
import { assertTrustedSender, validateAttentionSignal, validatePreferencePatch } from './validate-message';

interface HandlerDependencies {
  settings: SettingsService;
  trustedWebContentsIds: Set<number>;
  getCameraWindow(): BrowserWindow | null;
  openCameraWindow(): Promise<void>;
}

export function registerHandlers(dependencies: HandlerDependencies): () => void {
  const reactions = new AttentionReactionController();
  const channels = [
    IPC.main.openCamera,
    IPC.main.getAppInfo,
    IPC.camera.close,
    IPC.camera.getPreferences,
    IPC.camera.updatePreferences,
  ];

  ipcMain.handle(IPC.main.openCamera, async (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    await dependencies.openCameraWindow();
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
