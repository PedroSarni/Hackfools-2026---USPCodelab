import { contextBridge, ipcRenderer } from 'electron';
import type { InstagramBridge, ProcrastinationMilestone } from '../shared/contracts';

// Preloads sandboxed não podem carregar módulos locais em runtime.
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
