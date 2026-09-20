import type { BrowserWindow } from 'electron';

export async function loadRenderer(
  window: BrowserWindow,
  page: 'index.html' | 'camera.html' | 'instagram.html',
): Promise<void> {
  const developmentServer = process.env.VITE_DEV_SERVER_URL;
  if (developmentServer) {
    await window.loadURL(`${developmentServer}/${page}`);
    return;
  }
  await window.loadURL(`app://bundle/${page}`);
}
