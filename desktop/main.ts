import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, net, protocol, session } from 'electron';
import { registerHandlers } from './ipc/register-handlers';
import { SettingsService } from './services/settings-service';
import { ReelsService } from './services/reels-service';
import { parseByteRange } from './services/media-range';
import { createCameraWindow } from './windows/camera-window';
import { createInstagramWindow } from './windows/instagram-window';
import { createMainWindow } from './windows/main-window';

let mainWindow: BrowserWindow | null = null;
let cameraWindow: BrowserWindow | null = null;
let instagramWindow: BrowserWindow | null = null;
const trustedWebContentsIds = new Set<number>();
let disposeHandlers: (() => void) | undefined;

// Alguns drivers Linux falham ao importar frames H.264 como buffers GBM e
// derrubam o pipeline de mídia. O Chromium continua renderizando normalmente,
// mas decodifica os vídeos locais por software, de forma mais previsível.
app.commandLine.appendSwitch('disable-accelerated-video-decode');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

function configureAppProtocol(reels: ReelsService): void {
  const rendererRoot = resolve(__dirname, '../../dist-renderer');
  protocol.handle('app', async (request) => {
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
    return net.fetch(pathToFileURL(target).toString());
  });
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

async function openInstagramWindow(): Promise<void> {
  if (instagramWindow && !instagramWindow.isDestroyed()) {
    instagramWindow.show();
    instagramWindow.focus();
    return;
  }
  const createdInstagramWindow = await createInstagramWindow(mainWindow ?? undefined, (window) => {
    instagramWindow = window;
    trust(window);
  });
  instagramWindow = createdInstagramWindow;
  instagramWindow.once('closed', () => {
    instagramWindow = null;
  });
}

app.whenReady().then(async () => {
  const reelsDirectory = app.isPackaged
    ? join(process.resourcesPath, 'assets', 'reels')
    : join(app.getAppPath(), 'assets', 'reels');
  const reels = new ReelsService(reelsDirectory);
  configureAppProtocol(reels);
  configureMediaPermission();
  const settings = new SettingsService(join(app.getPath('userData'), 'settings.json'));
  await settings.load();

  disposeHandlers = registerHandlers({
    settings,
    reels,
    trustedWebContentsIds,
    getCameraWindow: () => cameraWindow,
    getInstagramWindow: () => instagramWindow,
    openCameraWindow,
    openInstagramWindow,
  });

  mainWindow = await createMainWindow(trust);
  mainWindow.once('closed', () => {
    mainWindow = null;
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
  instagramWindow?.close();
});
