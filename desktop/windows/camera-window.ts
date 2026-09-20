import { join } from 'node:path';
import { BrowserWindow, screen } from 'electron';
import { loadRenderer } from './load-renderer';

export async function createCameraWindow(
  _parent?: BrowserWindow,
  onCreated?: (window: BrowserWindow) => void,
): Promise<BrowserWindow> {
  const width = 360;
  const height = 270;
  const workArea = screen.getPrimaryDisplay().workArea;
  const window = new BrowserWindow({
    width,
    height,
    x: workArea.x + workArea.width - width - 18,
    y: workArea.y + 18,
    title: 'Foco Total — câmera',
    backgroundColor: '#10110f',
    show: false,
    frame: false,
    resizable: false,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: true,
    webPreferences: {
      backgroundThrottling: false,
      preload: join(__dirname, '../../preload/camera-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  onCreated?.(window);
  window.setAlwaysOnTop(true, 'floating');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.removeMenu();
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await loadRenderer(window, 'camera.html');
  return window;
}
