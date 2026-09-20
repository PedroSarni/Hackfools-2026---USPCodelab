import { contextBridge, ipcRenderer } from 'electron';
import type { MainBridge } from '../shared/contracts';

// Preloads sandboxed não podem carregar módulos locais em runtime.
const IPC = {
  openCamera: 'main:open-camera',
  getAppInfo: 'main:get-app-info',
} as const;

const bridge: MainBridge = {
  getAcademy: () => ipcRenderer.invoke('academy:get'),
  updateAcademy: (action) => ipcRenderer.invoke('academy:update', action),
  openCamera: () => ipcRenderer.invoke(IPC.openCamera),
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
};

contextBridge.exposeInMainWorld('baiStudyMain', bridge);
