import { join } from 'node:path';
import { BrowserWindow } from 'electron';
import { loadRenderer } from './load-renderer';

export async function createInstagramWindow(
  parent?: BrowserWindow,
  onCreated?: (window: BrowserWindow) => void,
): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 426,
    height: 856,
    minWidth: 390,
    minHeight: 720,
    maxWidth: 520,
    maxHeight: 980,
    title: 'BaiStudy — Instagram simulado',
    backgroundColor: '#000000',
    frame: false,
    show: false,
    parent,
    webPreferences: {
      preload: join(__dirname, '../../preload/instagram-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  onCreated?.(window);
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('console-message', (details) => {
    if (!details.message.startsWith('[Reels/')) return;
    const output = `[InstagramRenderer/${details.level}] ${details.message}`;
    if (details.level === 'error') console.error(output);
    else if (details.level === 'warning') console.warn(output);
    else console.info(output);
  });
  await loadRenderer(window, 'instagram.html');
  return window;
}
