import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { ReelsService } from './services/reels-service';
import { parseByteRange } from './services/media-range';
import { existsSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { app, BrowserWindow, Menu, protocol, session, Tray } from 'electron';
import { FredRuntime } from './fred/fred-runtime';
import { registerHandlers } from './ipc/register-handlers';
import { AcademyService } from './services/academy-service';
import { SettingsService } from './services/settings-service';
import { createCameraWindow } from './windows/camera-window';
import { createMainWindow } from './windows/main-window';

let mainWindow: BrowserWindow | null = null;
let cameraWindow: BrowserWindow | null = null;
let fred: FredRuntime | null = null;
let tray: Tray | null = null;
const trustedWebContentsIds = new Set<number>();
let disposeHandlers: (() => void) | undefined;
const nativeWayland = process.platform === 'linux' &&
  (app.commandLine.getSwitchValue('ozone-platform') === 'wayland' ||
    (!app.commandLine.hasSwitch('ozone-platform') && process.env.XDG_SESSION_TYPE === 'wayland'));

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'foco',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

function configureAppProtocol(reels: ReelsService): void {
  const rendererRoot = resolve(__dirname, '../../dist-renderer');
  protocol.handle('foco', async (request) => {
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname.startsWith('/__reels__/')) {
      let fileName: string;
      try {
        fileName = decodeURIComponent(requestUrl.pathname.slice('/__reels__/'.length));
      } catch (error) {
        console.error('[ReelsProtocol] URL inválida', {
          url: request.url,
          error: describeError(error),
        });
        return new Response('URL de vídeo inválida.', { status: 400 });
      }
      const mediaPath = reels.resolveMediaPath(fileName);
      if (!mediaPath) {
        console.error('[ReelsProtocol] mídia rejeitada antes da leitura', {
          fileName,
          url: request.url,
          reelsDirectory: reels.getDirectory(),
        });
        return new Response('Vídeo inválido.', { status: 404 });
      }
      return serveReel(request, mediaPath, reels.getDirectory());
    }
    const requestedPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
    const target = resolve(rendererRoot, requestedPath || 'index.html');
    const relativePath = relative(rendererRoot, target);
    if (relativePath.startsWith('..') || relativePath.includes('..')) {
      return new Response('Caminho inválido.', { status: 400 });
    }
    return serveRendererAsset(target);
  });
}

async function serveRendererAsset(filePath: string): Promise<Response> {
  try {
    const file = await stat(filePath);
    if (!file.isFile()) return new Response('Arquivo nao encontrado.', { status: 404 });

    const body = new Uint8Array(await readFile(filePath));
    return new Response(body, {
      headers: {
        'Content-Length': String(file.size),
        'Content-Type': getContentType(filePath),
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return new Response('Arquivo nao encontrado.', { status: 404 });
    }
    console.error('[AppProtocol] falha ao servir arquivo local', {
      filePath,
      error: describeError(error),
    });
    return new Response('Falha ao ler arquivo.', { status: 500 });
  }
}

function getContentType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webm':
      return 'video/webm';
    case '.mp4':
      return 'video/mp4';
    case '.wasm':
      return 'application/wasm';
    default:
      return 'application/octet-stream';
  }
}

async function serveReel(request: Request, mediaPath: string, reelsDirectory: string): Promise<Response> {
  const requestDetails = {
    method: request.method,
    url: request.url,
    range: request.headers.get('range'),
    absolutePath: mediaPath,
    relativePath: relative(resolve(reelsDirectory), mediaPath),
  };
  try {
    const file = await stat(mediaPath);
    if (!file.isFile()) {
      console.error('[ReelsProtocol] caminho não é um arquivo', requestDetails);
      return new Response('Vídeo não encontrado.', { status: 404 });
    }
    const range = parseByteRange(request.headers.get('range'), file.size);
    if (range === null) {
      console.error('[ReelsProtocol] Range rejeitado', { ...requestDetails, fileSize: file.size });
      return new Response('Intervalo inválido.', {
        status: 416,
        headers: { 'Content-Range': `bytes */${file.size}` },
      });
    }

    const start = range?.start ?? 0;
    const end = range?.end ?? file.size - 1;
    const fileStream = createReadStream(mediaPath, { start, end });
    fileStream.on('error', (error) => {
      const details = {
        ...requestDetails,
        start,
        end,
        error: describeError(error),
      };
      if (error.name === 'AbortError') console.info('[ReelsProtocol] streaming cancelado pelo cliente', details);
      else console.error('[ReelsProtocol] erro durante streaming', details);
    });
    const body = Readable.toWeb(fileStream) as unknown as ConstructorParameters<typeof Response>[0];
    const partial = range !== undefined;
    console.info('[ReelsProtocol] mídia encontrada e resposta criada', {
      ...requestDetails,
      status: partial ? 206 : 200,
      fileSize: file.size,
      start,
      end,
      contentLength: end - start + 1,
    });
    return new Response(body, {
      status: partial ? 206 : 200,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Content-Type': mediaPath.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4',
        ...(partial ? { 'Content-Range': `bytes ${start}-${end}/${file.size}` } : {}),
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('[ReelsProtocol] arquivo não encontrado', {
        ...requestDetails,
        error: describeError(error),
      });
      return new Response('Vídeo não encontrado.', { status: 404 });
    }
    console.error('[ReelsProtocol] falha ao servir Reel local', {
      ...requestDetails,
      error: describeError(error),
    });
    return new Response('Falha ao ler vídeo.', { status: 500 });
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
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
    if (cameraWindow.isMinimized()) cameraWindow.restore();
    cameraWindow.show();
    cameraWindow.focus();
    return;
  }
  const createdCameraWindow = await createCameraWindow(mainWindow ?? undefined, (window) => {
    cameraWindow = window;
    trust(window);
  });
  cameraWindow = createdCameraWindow;
  cameraWindow.once('closed', () => { cameraWindow = null; });
}

async function openMainWindow(): Promise<void> {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  mainWindow = await createMainWindow((window) => {
    mainWindow = window;
    trust(window);
  });
  mainWindow.once('closed', () => { mainWindow = null; });
}

function createTray(): void {
  const developmentIcon = resolve(__dirname, '../../public/desktop/foco-total.png');
  const builtIcon = resolve(__dirname, '../../dist-renderer/desktop/foco-total.png');
  const icon = existsSync(builtIcon) ? builtIcon : developmentIcon;
  if (!existsSync(icon)) return;
  tray = new Tray(icon);
  tray.setToolTip('Foco Total — fiscal de estudos');
  tray.on('click', () => void openMainWindow());
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir área de trabalho', click: () => void openMainWindow() },
    { type: 'separator' },
    { label: 'Sair do Foco Total', click: () => app.quit() },
  ]));
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => void openMainWindow());
  void app.whenReady().then(async () => {
    configureAppProtocol(new ReelsService(join(app.getAppPath(), 'assets', 'reels')));
    configureMediaPermission();

    const settings = new SettingsService(join(app.getPath('userData'), 'settings.json'));
    const academy = new AcademyService(join(app.getPath('userData'), 'academy.json'));
    await Promise.all([settings.load(), academy.load(true)]);

    fred = new FredRuntime(settings, nativeWayland, () => [mainWindow, cameraWindow]);
    disposeHandlers = registerHandlers({
      academy,
      settings,
      trustedWebContentsIds,
      getCameraWindow: () => cameraWindow,
      getMainWindow: () => mainWindow,
      openCameraWindow,
      fred,
    });

    await fred.start();
    await openMainWindow();

    createTray();

    app.on('activate', () => void openMainWindow());
  }).catch((error) => {
    console.error('Falha ao iniciar o Foco Total.', error);
    app.quit();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  disposeHandlers?.();
  fred?.dispose();
  tray?.destroy();
  cameraWindow?.close();
});
