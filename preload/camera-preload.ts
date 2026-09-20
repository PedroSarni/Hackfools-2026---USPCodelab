import { contextBridge, ipcRenderer } from 'electron';
import type { CameraBridge, CameraPreferences, FredReaction } from '../shared/contracts';

// Preloads sandboxed não podem carregar módulos locais em runtime.
const IPC = {
  close: 'camera:close',
  getPreferences: 'camera:get-preferences',
  updatePreferences: 'camera:update-preferences',
  attentionUpdated: 'attention:updated',
  fredReaction: 'fred:reaction',
} as const;

const bridge: CameraBridge = {
  closeWindow: () => ipcRenderer.invoke(IPC.close),
  getPreferences: () => ipcRenderer.invoke(IPC.getPreferences),
  updatePreferences: (patch: Partial<CameraPreferences>) =>
    ipcRenderer.invoke(IPC.updatePreferences, patch),
  publishAttention: (signal) => ipcRenderer.send(IPC.attentionUpdated, signal),
  onFredReaction: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, reaction: FredReaction): void => callback(reaction);
    ipcRenderer.on(IPC.fredReaction, listener);
    return () => ipcRenderer.removeListener(IPC.fredReaction, listener);
  },
};

contextBridge.exposeInMainWorld('baiStudyCamera', bridge);
