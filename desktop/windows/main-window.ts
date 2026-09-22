import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import { loadRenderer } from './load-renderer';

export async function createMainWindow(onCreated?: (window: BrowserWindow) => void): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 720,
    minHeight: 520,
    title: 'FreddyBuddy',
    icon: join(__dirname, '../../../public/fred/tray.png'),
    backgroundColor: '#f7f5ef',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../../preload/main-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  onCreated?.(window);
  window.removeMenu();
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await loadRenderer(window, 'index.html');
  return window;
}
