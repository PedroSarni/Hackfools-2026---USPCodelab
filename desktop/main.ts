import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, net, protocol, session } from 'electron';
import { registerHandlers } from './ipc/register-handlers';
import { SettingsService } from './services/settings-service';
import { createCameraWindow } from './windows/camera-window';
import { createMainWindow } from './windows/main-window';

let mainWindow: BrowserWindow | null = null;
let cameraWindow: BrowserWindow | null = null;
const trustedWebContentsIds = new Set<number>();
let disposeHandlers: (() => void) | undefined;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

function configureAppProtocol(): void {
  const rendererRoot = resolve(__dirname, '../../dist-renderer');
  protocol.handle('app', (request) => {
    const requestUrl = new URL(request.url);
    const requestedPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
    const target = resolve(rendererRoot, requestedPath || 'index.html');
    const relativePath = relative(rendererRoot, target);
    if (relativePath.startsWith('..') || relativePath.includes('..')) {
      return new Response('Caminho inválido.', { status: 400 });
    }
    return net.fetch(pathToFileURL(target).toString());
  });
}

function trust(window: BrowserWindow): void {
  trustedWebContentsIds.add(window.webContents.id);
  window.webContents.once('destroyed', () => trustedWebContentsIds.delete(window.webContents.id));
}

function configureMediaPermission(): void {
  const isTrustedContents = (contents: Electron.WebContents | null): boolean =>
    contents !== null && trustedWebContentsIds.has(contents.id) && contents.id === cameraWindow?.webContents.id;

  session.defaultSession.setPermissionCheckHandler((contents, permission, _origin, details) => {
    if (permission !== 'media' || !isTrustedContents(contents)) return false;
    const mediaTypes = (details as { mediaTypes?: string[] }).mediaTypes;
    return !mediaTypes || mediaTypes.length === 0 || (mediaTypes.includes('video') && !mediaTypes.includes('audio'));
  });
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback, details) => {
    const mediaTypes = (details as { mediaTypes?: string[] }).mediaTypes ?? [];
    callback(
      permission === 'media' &&
        isTrustedContents(contents) &&
        mediaTypes.includes('video') &&
        !mediaTypes.includes('audio'),
    );
  });
}

async function openCameraWindow(): Promise<void> {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.show();
    cameraWindow.focus();
    return;
  }
  const createdCameraWindow = await createCameraWindow(mainWindow ?? undefined, (window) => {
    cameraWindow = window;
    trust(window);
  });
  cameraWindow = createdCameraWindow;
  cameraWindow.once('closed', () => {
    cameraWindow = null;
  });
}

app.whenReady().then(async () => {
  configureAppProtocol();
  configureMediaPermission();
  const settings = new SettingsService(join(app.getPath('userData'), 'settings.json'));
  await settings.load();

  mainWindow = await createMainWindow(trust);
  mainWindow.once('closed', () => {
    mainWindow = null;
  });

  disposeHandlers = registerHandlers({
    settings,
    trustedWebContentsIds,
    getCameraWindow: () => cameraWindow,
    openCameraWindow,
  });

  app.on('activate', async () => {
    if (!mainWindow) {
      mainWindow = await createMainWindow(trust);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  disposeHandlers?.();
  cameraWindow?.close();
});
