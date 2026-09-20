import { contextBridge, ipcRenderer } from 'electron';
import type { FredAudio, FredBridge, FredState } from '../shared/contracts';

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
