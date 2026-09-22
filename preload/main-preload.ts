import { contextBridge, ipcRenderer } from 'electron';
import type { FredMood, FredSimulation, FredState, MainBridge } from '../shared/contracts';

const IPC = {
  openCamera: 'main:open-camera',
  getAppInfo: 'main:get-app-info',
  fredGetState: 'fred:get-state', fredState: 'fred:state', fredShow: 'fred:show', fredHide: 'fred:hide',
  fredSimulate: 'fred:simulate', fredPreview: 'fred:preview', fredVoiceEnabled: 'fred:voice-enabled',
  fredVoiceTest: 'fred:voice-test', fredVoiceStop: 'fred:voice-stop', quit: 'app:quit',
} as const;

const bridge: MainBridge = {
  materialOpened: (id) => ipcRenderer.invoke('buddy:material-opened', id),
  skinSelected: (id) => ipcRenderer.invoke('buddy:skin-selected', id),
  getSession: () => ipcRenderer.invoke('buddy:get-session'),
  startBuddy: () => ipcRenderer.invoke('buddy:start'),
  dismissBuddy: () => ipcRenderer.invoke('buddy:dismiss'),
  finishBuddy: () => ipcRenderer.invoke('buddy:finish'),
  openInstagram: () => ipcRenderer.invoke('main:open-instagram'),
  onNavigate: (callback) => { const listener = (_event: Electron.IpcRendererEvent, target: string): void => callback(target); ipcRenderer.on('desktop:navigate', listener); return () => ipcRenderer.removeListener('desktop:navigate', listener); },
  getAcademy: () => ipcRenderer.invoke('academy:get'),
  updateAcademy: (action) => ipcRenderer.invoke('academy:update', action),
  openCamera: () => ipcRenderer.invoke(IPC.openCamera),
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
  getFredState: () => ipcRenderer.invoke(IPC.fredGetState),
  showFred: () => ipcRenderer.invoke(IPC.fredShow),
  hideFred: () => ipcRenderer.invoke(IPC.fredHide),
  simulateFred: (event: FredSimulation) => ipcRenderer.invoke(IPC.fredSimulate, event),
  previewFred: (mood: FredMood) => ipcRenderer.invoke(IPC.fredPreview, mood),
  setFredVoiceEnabled: (enabled: boolean) => ipcRenderer.invoke(IPC.fredVoiceEnabled, enabled),
  testFredVoice: () => ipcRenderer.invoke(IPC.fredVoiceTest),
  stopFredVoice: () => ipcRenderer.invoke(IPC.fredVoiceStop),
  quitApp: () => ipcRenderer.invoke(IPC.quit),
  onFredState: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: FredState): void => callback(state);
    ipcRenderer.on(IPC.fredState, listener);
    return () => ipcRenderer.removeListener(IPC.fredState, listener);
  },
};

contextBridge.exposeInMainWorld('baiStudyMain', bridge);

import type { FredAudio, FredBridge } from '../shared/contracts';
{

const IPC = {
  getState: 'fred:get-state', state: 'fred:state', audio: 'fred:audio', openMain: 'fred:open-main', hide: 'fred:hide',
  hover: 'fred:hover', voicePlayback: 'fred:voice-playback',
} as const;

const bridge: FredBridge = {
  getState: () => ipcRenderer.invoke(IPC.getState),
  openMain: () => ipcRenderer.invoke(IPC.openMain),
  hide: () => ipcRenderer.invoke(IPC.hide),
  hover: (inside) => ipcRenderer.send(IPC.hover, inside),
  reportVoicePlayback: (id, status) => ipcRenderer.send(IPC.voicePlayback, id, status),
  onState: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: FredState): void => callback(state);
    ipcRenderer.on(IPC.state, listener);
    return () => ipcRenderer.removeListener(IPC.state, listener);
  },
  onAudio: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, audio: FredAudio | { stop: true }): void => callback(audio);
    ipcRenderer.on(IPC.audio, listener);
    return () => ipcRenderer.removeListener(IPC.audio, listener);
  },
};

contextBridge.exposeInMainWorld('baiStudyFred', bridge);
}

import type { InstagramBridge, ProcrastinationMilestone } from '../shared/contracts';
{

const IPC = {
  close: 'instagram:close',
  getReels: 'instagram:get-reels',
  getProcrastinationState: 'instagram:get-procrastination-state',
  recordProcrastinationMilestone: 'instagram:record-procrastination-milestone',
  startStudying: 'instagram:start-studying',
} as const;

const bridge: InstagramBridge = {
  closeWindow: () => ipcRenderer.invoke(IPC.close),
  getReels: () => ipcRenderer.invoke(IPC.getReels),
  getProcrastinationState: () => ipcRenderer.invoke(IPC.getProcrastinationState),
  recordProcrastinationMilestone: (milestone: ProcrastinationMilestone) =>
    ipcRenderer.invoke(IPC.recordProcrastinationMilestone, milestone),
  startStudying: () => ipcRenderer.invoke(IPC.startStudying),
};

contextBridge.exposeInMainWorld('baiStudyInstagram', bridge);
}
