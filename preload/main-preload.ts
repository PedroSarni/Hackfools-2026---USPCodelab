import { contextBridge, ipcRenderer } from 'electron';
import type { MainBridge } from '../shared/contracts';

// Preloads sandboxed não podem carregar módulos locais em runtime.
const IPC = {
  openCamera: 'main:open-camera',
  openInstagram: 'main:open-instagram',
  getAppInfo: 'main:get-app-info',
} as const;

const bridge: MainBridge = {
  openCamera: () => ipcRenderer.invoke(IPC.openCamera),
  openInstagram: () => ipcRenderer.invoke(IPC.openInstagram),
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
};

contextBridge.exposeInMainWorld('baiStudyMain', bridge);
