import { join } from 'node:path';
import { BrowserWindow, screen } from 'electron';
import { FRED_SIZE, chooseFredPosition } from '../behavior/fred-position-controller';
import { loadRenderer } from './load-renderer';

export async function createFredWindow(
  nativeWayland: boolean,
  onCreated?: (window: BrowserWindow) => void,
  showInitially = true,
): Promise<BrowserWindow> {
  const initial = chooseFredPosition(screen.getPrimaryDisplay().workArea, 'discreet');
  const window = new BrowserWindow({
    ...FRED_SIZE,
    x: initial.x,
    y: initial.y,
    title: 'Freddy',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    focusable: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: !nativeWayland,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../../preload/fred-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  onCreated?.(window);
  if (!nativeWayland) {
    window.setAlwaysOnTop(true, 'floating');
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  window.removeMenu();
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  await loadRenderer(window, 'fred.html');
  if (showInitially) window.showInactive();
  return window;
}
