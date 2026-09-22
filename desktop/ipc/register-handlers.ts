import { ReelsService } from '../services/reels-service';
import { MATERIAL_LINES, SKIN_LINES } from '../../shared/freddy-lines';
import { join } from 'node:path';
import { app, ipcMain, type BrowserWindow } from 'electron';
import type { AcademyService } from '../services/academy-service';
import { balanceOf, FREDDY_DISMISS_PRICE, type AcademyAction } from '../../shared/academy';
import { canDismissFreddy, sessionReels, type FreddyPhase } from '../../shared/freddy-session';
import { FRED_MOODS, FRED_SIMULATIONS, type AppInfo } from '../../shared/contracts';
import { IPC } from '../../shared/events';
import { AttentionReactionController } from '../behavior/attention-reaction-controller';
import type { SettingsService } from '../services/settings-service';
import type { FredRuntime } from '../fred/fred-runtime';
import { assertTrustedSender, validateAttentionSignal, validatePreferencePatch } from './validate-message';

interface HandlerDependencies {
  academy: AcademyService;
  settings: SettingsService;
  trustedWebContentsIds: Set<number>;
  getCameraWindow(): BrowserWindow | null;
  getMainWindow(): BrowserWindow | null;
  openCameraWindow(): Promise<void>;
  fred: FredRuntime;
}

export function registerHandlers(dependencies: HandlerDependencies): () => void {
  const reactions = new AttentionReactionController();
  const reels = new ReelsService(join(app.getAppPath(), 'assets', 'reels'));
  const sessionState = { warningShown: false, limitReached: false };
  let phase: FreddyPhase = 'waiting';
  const buddyState = () => {
    const academy = dependencies.academy.getState();
    const tasksCompleted = canDismissFreddy(academy);
    const balance = balanceOf(academy);
    return { phase, tasksCompleted, balance, canDismiss: phase === 'active' && (tasksCompleted || balance >= FREDDY_DISMISS_PRICE) };
  };
  const requireActive = (): void => { if (phase !== 'active') throw new Error('Foco Total não está ativo.'); };
  const channels = [
    'buddy:material-opened', 'buddy:skin-selected',
    'buddy:get-session', 'buddy:start', 'buddy:dismiss', 'buddy:finish',
    'main:open-instagram', 'camera:minimize', 'instagram:close', 'instagram:get-reels', 'instagram:get-procrastination-state', 'instagram:record-procrastination-milestone', 'instagram:start-studying',
    'academy:get', 'academy:update',
    IPC.main.openCamera,
    IPC.main.getAppInfo,
    IPC.camera.close,
    IPC.camera.getPreferences,
    IPC.camera.updatePreferences,
    IPC.fred.getState,
    IPC.fred.show,
    IPC.fred.hide,
    IPC.fred.simulate,
    IPC.fred.preview,
    IPC.fred.openMain,
    IPC.fred.voiceEnabled,
    IPC.fred.voiceTest,
    IPC.fred.voiceStop,
    IPC.fred.quit,
  ];
  const requireMain = (event: Electron.IpcMainInvokeEvent): void => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    if (event.sender.id !== dependencies.getMainWindow()?.webContents.id) throw new Error('Origem acadêmica não autorizada.');
  };
  ipcMain.handle('buddy:get-session', (event) => { requireMain(event); return buddyState(); });
  ipcMain.handle('buddy:start', (event) => {
    requireMain(event);
    if (phase === 'waiting') phase = 'active';
    requireActive();
    dependencies.fred.show();
    return buddyState();
  });
  ipcMain.handle('buddy:dismiss', async (event) => {
    requireMain(event);
    requireActive();
    if (!canDismissFreddy(dependencies.academy.getState())) await dependencies.academy.dispatch({ type: 'freddy.dismiss.buy' });
    phase = 'dying';
    dependencies.fred.retire();
    dependencies.getCameraWindow()?.close();
    sessionState.warningShown = false;
    sessionState.limitReached = false;
    return buddyState();
  });
  ipcMain.handle('buddy:finish', (event) => {
    requireMain(event);
    if (phase !== 'dying' && phase !== 'retired') throw new Error('A despedida ainda não começou.');
    phase = 'retired';
    return buddyState();
  });
  ipcMain.handle('main:open-instagram', (event) => { requireMain(event); event.sender.send('desktop:navigate', 'instagram'); });
  ipcMain.handle('camera:minimize', (event) => { assertTrustedSender(event, dependencies.trustedWebContentsIds); dependencies.getCameraWindow()?.hide(); });
  ipcMain.handle('instagram:close', (event) => { requireMain(event); event.sender.send('desktop:navigate', 'desktop'); });
  ipcMain.handle('instagram:get-reels', async (event) => { requireMain(event); return sessionReels(await reels.list(), phase); });
  ipcMain.handle('instagram:get-procrastination-state', (event) => { requireMain(event); return { ...sessionState }; });
  ipcMain.handle('instagram:record-procrastination-milestone', (event, value) => { requireMain(event); requireActive(); if (value !== 'warning' && value !== 'limit') throw new Error('Marco inválido'); sessionState.warningShown = true; if (value === 'limit') sessionState.limitReached = true; return { ...sessionState }; });
  ipcMain.handle('instagram:start-studying', (event) => { requireMain(event); requireActive(); event.sender.send('desktop:navigate', 'foco'); });
  ipcMain.handle('academy:get', (event) => { requireMain(event); return dependencies.academy.getState(); });
  ipcMain.handle('academy:update', async (event, action: AcademyAction) => {
    requireMain(event); requireActive();
    const alreadyDone = action.type === 'mission.complete' && dependencies.academy.getState().missions.find(m => m.id === action.id)?.completedAt;
    const state = await dependencies.academy.dispatch(action);
    if (action.type === 'mission.complete' && !alreadyDone) dependencies.fred.say(MATERIAL_LINES[action.id]?.completed ?? 'Atividade concluída! Mais uma para a coleção.', true);
    return state;
  });
  ipcMain.handle('buddy:material-opened', (event, id: unknown) => {
    requireMain(event); requireActive();
    if (typeof id !== 'string' || !dependencies.academy.getState().missions.some(m => m.id === id)) throw new Error('Material inválido.');
    dependencies.fred.say(MATERIAL_LINES[id]?.opened ?? 'Material aberto!');
  });
  ipcMain.handle('buddy:skin-selected', (event, id: unknown) => {
    requireMain(event); requireActive();
    if (typeof id !== 'string' || !Object.hasOwn(SKIN_LINES, id)) throw new Error('Skin inválida.');
    dependencies.fred.say(SKIN_LINES[id]);
  });

  ipcMain.handle(IPC.main.openCamera, async (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    requireActive();
    await dependencies.openCameraWindow();
  });

  ipcMain.handle(IPC.main.getAppInfo, (event): AppInfo => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return { version: app.getVersion(), implementedStages: [1, 2, 3], fredImplemented: true };
  });

  ipcMain.handle(IPC.fred.getState, (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    return dependencies.fred.getState();
  });
  ipcMain.handle(IPC.fred.show, (event) => { assertTrustedSender(event, dependencies.trustedWebContentsIds); requireActive(); dependencies.fred.show(); });
  ipcMain.handle(IPC.fred.hide, (event) => { assertTrustedSender(event, dependencies.trustedWebContentsIds); dependencies.fred.hide(); });
  ipcMain.handle(IPC.fred.openMain, (event) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    const main = dependencies.getMainWindow();
    if (main?.isMinimized()) main.restore();
    main?.show(); main?.focus();
  });
  ipcMain.handle(IPC.fred.simulate, (event, value: unknown) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    requireActive();
    if (typeof value !== 'string' || !FRED_SIMULATIONS.includes(value as never)) throw new Error('Simulação inválida.');
    return dependencies.fred.simulate(value as (typeof FRED_SIMULATIONS)[number]);
  });
  ipcMain.handle(IPC.fred.preview, (event, value: unknown) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    requireActive();
    if (typeof value !== 'string' || !FRED_MOODS.includes(value as never)) throw new Error('Humor inválido.');
    dependencies.fred.preview(value as (typeof FRED_MOODS)[number]);
  });
  ipcMain.handle(IPC.fred.voiceEnabled, async (event, value: unknown) => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    if (typeof value !== 'boolean') throw new Error('Configuração de voz inválida.');
    await dependencies.fred.setVoiceEnabled(value);
  });
  ipcMain.handle(IPC.fred.voiceTest, (event) => { assertTrustedSender(event, dependencies.trustedWebContentsIds); dependencies.fred.testVoice(); });
  ipcMain.handle(IPC.fred.voiceStop, (event) => { assertTrustedSender(event, dependencies.trustedWebContentsIds); dependencies.fred.stopVoice(); });
  ipcMain.handle(IPC.fred.quit, (event) => { assertTrustedSender(event, dependencies.trustedWebContentsIds); app.quit(); });

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
      if (phase !== 'active' || event.sender.id !== dependencies.getCameraWindow()?.webContents.id) return;
      const signal = validateAttentionSignal(value);
      const reaction = reactions.consume(signal);
      if (reaction) {
        dependencies.fred.reactToCamera(reaction);
      }
    } catch (error) {
      console.warn('Sinal de atenção rejeitado.', error);
    }
  };
  ipcMain.on(IPC.camera.attentionUpdated, attentionListener);
  const hoverListener = (event: Electron.IpcMainEvent, value: unknown): void => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    if (typeof value === 'boolean') dependencies.fred.hover(value);
  };
  const playbackListener = (event: Electron.IpcMainEvent, id: unknown, status: unknown): void => {
    assertTrustedSender(event, dependencies.trustedWebContentsIds);
    if (typeof id === 'number' && (status === 'playing' || status === 'ended' || status === 'error')) dependencies.fred.voicePlayback(id, status);
  };
  ipcMain.on(IPC.fred.hover, hoverListener);
  ipcMain.on(IPC.fred.voicePlayback, playbackListener);

  return () => {
    for (const channel of channels) ipcMain.removeHandler(channel);
    ipcMain.removeListener(IPC.camera.attentionUpdated, attentionListener);
    ipcMain.removeListener(IPC.fred.hover, hoverListener);
    ipcMain.removeListener(IPC.fred.voicePlayback, playbackListener);
  };
}
