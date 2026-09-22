import { contextBridge, ipcRenderer } from 'electron';
import type { CameraBridge, CameraPreferences } from '../shared/contracts';

const IPC = {
  close: 'camera:close',
  getPreferences: 'camera:get-preferences',
  updatePreferences: 'camera:update-preferences',
  attentionUpdated: 'attention:updated',
} as const;

const bridge: CameraBridge = {
  minimizeWindow: () => ipcRenderer.invoke('camera:minimize'),
  closeWindow: () => ipcRenderer.invoke(IPC.close),
  getPreferences: () => ipcRenderer.invoke(IPC.getPreferences),
  updatePreferences: (patch: Partial<CameraPreferences>) =>
    ipcRenderer.invoke(IPC.updatePreferences, patch),
  publishAttention: (signal) => ipcRenderer.send(IPC.attentionUpdated, signal),
};

contextBridge.exposeInMainWorld('baiStudyCamera', bridge);
