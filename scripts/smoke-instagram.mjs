import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import electron from 'electron';

const port = 9556;
const { ELECTRON_RUN_AS_NODE: _ignored, ...environment } = process.env;
const child = spawn(electron, ['.', '--ozone-platform=x11', `--remote-debugging-port=${port}`], {
  cwd: process.cwd(),
  env: environment,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let diagnostics = '';
let applicationLogs = '';
child.stdout.on('data', (chunk) => { applicationLogs += String(chunk); });
child.stderr.on('data', (chunk) => { diagnostics += String(chunk); });

try {
  const mainPage = await waitForPage((page) => page.url.endsWith('/index.html'));
  await new Promise((resolve) => setTimeout(resolve, 300));
  const pagesBeforeInstagramClick = await pages();
  const mainResult = await evaluate(mainPage, `({
    title: document.title,
    hasDesktop: Boolean(document.querySelector('.desktop-shell')),
    appIds: [...document.querySelectorAll('[data-app-id]')].map(item => item.dataset.appId),
    instagramWasNotOpenedAutomatically: ${!pagesBeforeInstagramClick.some((page) => page.url.endsWith('/instagram.html'))},
    bridge: Object.keys(window.baiStudyMain || {})
  })`);
  await captureScreenshot(mainPage, '/tmp/baistudy-desktop.png');
  await evaluate(mainPage, 'window.baiStudyMain.openCamera()', true);
  const cameraPage = await waitForPage((page) => page.url.endsWith('/camera.html'));
  await new Promise((resolve) => setTimeout(resolve, 200));
  const cameraResult = await evaluate(cameraPage, `({
    bridge: Object.keys(window.baiStudyCamera || {}),
    startsInactive: document.body.innerText.includes('Câmera desligada')
  })`);
  await evaluate(cameraPage, 'setTimeout(() => window.baiStudyCamera.closeWindow(), 0); true');
  await evaluate(mainPage, `document.querySelector('[data-app-id="instagram"]').click(); true`);
  const instagramPage = await waitForPage((page) => page.url.endsWith('/instagram.html'));
  await new Promise((resolve) => setTimeout(resolve, 300));
  const initialResult = await evaluate(instagramPage, `({
    width: window.outerWidth,
    height: window.outerHeight,
    homeVisible: Boolean(document.querySelector('.instagram-home')),
    homeImageLoaded: Boolean(document.querySelector('.instagram-home img')?.complete),
    hasDesktopButton: Boolean(document.querySelector('button[aria-label="Voltar ao Desktop"]')),
    codecSupport: {
      h264Aac: document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'),
      vp8Opus: document.createElement('video').canPlayType('video/webm; codecs="vp8, opus"')
    },
    bridge: Object.keys(window.baiStudyInstagram || {}),
    procrastinationState: await window.baiStudyInstagram.getProcrastinationState(),
    reels: await window.baiStudyInstagram.getReels(),
    mediaResponses: await Promise.all((await window.baiStudyInstagram.getReels()).map(async reel => {
      const response = await fetch(reel.url, { headers: { Range: 'bytes=0-1023' } });
      return { fileName: reel.fileName, status: response.status, type: response.headers.get('content-type'), length: response.headers.get('content-length') };
    }))
  })`, true);
  await captureScreenshot(instagramPage, '/tmp/baistudy-instagram-home.png');
  await evaluate(instagramPage, `document.querySelector('button[aria-label="Reels"]').click()`);
  await new Promise((resolve) => setTimeout(resolve, 800));
  const antiProcrastinationResult = await evaluate(instagramPage, `(async () => {
    const items = [...document.querySelectorAll('.reel')];
    const feed = document.querySelector('.reels-feed');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const position = () => Math.round(feed.scrollTop / feed.clientHeight) + 1;
    const snapshot = () => {
      const index = position() - 1;
      const item = items[index];
      const video = item?.querySelector('video');
      return {
        position: index + 1,
        type: item?.dataset.reelType,
        label: item?.querySelector('.reel__meta p, .study-reel h2')?.textContent || '',
        video: video ? {
          currentSrc: decodeURIComponent(video.currentSrc.split('/').pop() || ''),
          readyState: video.readyState,
          dimensions: [video.videoWidth, video.videoHeight],
          error: video.error ? { code: video.error.code, message: video.error.message } : null
        } : null
      };
    };
    const advance = async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      await wait(1300);
      return snapshot();
    };

    const visited = [snapshot(), await advance(), await advance()];
    const warning = {
      visible: Boolean(document.querySelector('.procrastination-modal')),
      title: document.querySelector('.procrastination-modal h2')?.textContent || '',
      button: document.querySelector('.procrastination-modal button')?.textContent || ''
    };
    const positionBeforeBlockedArrow = position();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await wait(300);
    const positionAfterBlockedArrow = position();
    document.querySelector('.procrastination-modal button').click();
    await wait(250);

    while (position() < 9) visited.push(await advance());
    const limit = {
      visible: Boolean(document.querySelector('.procrastination-modal')),
      title: document.querySelector('.procrastination-modal h2')?.textContent || '',
      button: document.querySelector('.procrastination-modal button')?.textContent || ''
    };
    const limitPositionBeforeArrow = position();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await wait(300);

    return {
      feedTypes: items.map(item => item.dataset.reelType),
      visited,
      warning,
      warningBlockedNavigation: [positionBeforeBlockedArrow, positionAfterBlockedArrow],
      limit,
      limitBlockedNavigation: [limitPositionBeforeArrow, position()],
      sessionState: await window.baiStudyInstagram.getProcrastinationState()
    };
  })()`, true);
  const reelsResult = await evaluate(instagramPage, `({
    homeVisible: Boolean(document.querySelector('.instagram-home')),
    reelsViewVisible: Boolean(document.querySelector('.reels-feed, .reels-message')),
    navigation: [...document.querySelectorAll('.instagram-nav button')].map(button => ({
      label: button.getAttribute('aria-label'),
      x: button.getBoundingClientRect().x,
      width: button.getBoundingClientRect().width
    })),
    text: document.body.innerText
  })`);
  await captureScreenshot(instagramPage, '/tmp/baistudy-instagram-reels.png');
  await evaluate(instagramPage, `document.querySelector('button[aria-label="Voltar ao Desktop"]').click(); true`);
  await new Promise((resolve) => setTimeout(resolve, 350));
  const pagesAfterDesktopClick = await pages();
  const returnToDesktopResult = {
    instagramClosed: !pagesAfterDesktopClick.some((page) => page.url.endsWith('/instagram.html')),
    desktopStillOpen: pagesAfterDesktopClick.some((page) => page.url.endsWith('/index.html')),
  };
  console.log(JSON.stringify({ mainResult, cameraResult, initialResult, antiProcrastinationResult, reelsResult, returnToDesktopResult }, null, 2));
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
  }
  const relevantDiagnostics = diagnostics.split('\n').filter((line) => line && !line.includes('DevTools listening')).join('\n');
  if (applicationLogs.trim()) process.stderr.write(`[logs do aplicativo]\n${applicationLogs.trim()}\n`);
  if (relevantDiagnostics) process.stderr.write(`${relevantDiagnostics}\n`);
}

async function pages() {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  return response.json();
}

async function waitForPage(predicate) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const page = (await pages()).find(predicate);
      if (page) return page;
    } catch {
      // O Electron ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('A página esperada não apareceu durante o smoke test.');
}

function evaluate(page, expression, awaitPromise = false) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    const timeout = setTimeout(() => reject(new Error('Timeout ao avaliar a página.')), 30_000);
    socket.onopen = () => socket.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: awaitPromise ? `(async()=>${expression})()` : expression, awaitPromise, returnByValue: true },
    }));
    socket.onerror = () => reject(new Error('Falha ao conectar ao renderer.'));
    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (response.result?.exceptionDetails) {
        const detail = response.result.exceptionDetails.exception?.description ?? response.result.exceptionDetails.text;
        reject(new Error(`${detail}\nExpressão: ${expression}`));
      }
      else resolve(response.result?.result?.value);
    };
  });
}

function captureScreenshot(page, target) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    const timeout = setTimeout(() => reject(new Error('Timeout ao capturar screenshot.')), 5_000);
    socket.onopen = () => socket.send(JSON.stringify({
      id: 1,
      method: 'Page.captureScreenshot',
      params: { format: 'png', fromSurface: true },
    }));
    socket.onerror = () => reject(new Error('Falha ao conectar ao renderer para screenshot.'));
    socket.onmessage = async (event) => {
      const response = JSON.parse(event.data);
      if (response.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (!response.result?.data) reject(new Error('Screenshot vazio.'));
      else {
        await writeFile(target, Buffer.from(response.result.data, 'base64'));
        resolve();
      }
    };
  });
}
