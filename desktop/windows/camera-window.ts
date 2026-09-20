import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import { loadRenderer } from './load-renderer';

export async function createCameraWindow(
  parent?: BrowserWindow,
  onCreated?: (window: BrowserWindow) => void,
): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 720,
    minHeight: 540,
    title: 'BaiStudy — câmera',
    backgroundColor: '#10110f',
    show: false,
    parent,
    webPreferences: {
      preload: join(__dirname, '../../preload/camera-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  onCreated?.(window);
  window.removeMenu();
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await loadRenderer(window, 'camera.html');
  return window;
}
