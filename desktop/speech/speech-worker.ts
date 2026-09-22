import { parentPort } from 'node:worker_threads';
import initialize from '@echogarden/espeak-ng-emscripten';

if (!parentPort) throw new Error('Worker de voz iniciado fora de uma worker thread.');

const enginePromise = initialize().then((module) => {
  const engine = new module.eSpeakNGWorker();
  engine.set_voice('pt-br');
  engine.set_rate(1.75 * 1.3);
  engine.set_pitch(1.0);
  engine.set_range(0.65);
  return engine;
});

parentPort.on('message', async ({ id, text }: { id: number; text: string }) => {
  try {
    const engine = await enginePromise;
    const chunks: Int16Array[] = [];
    const safeText = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    engine.synthesize(safeText, (samples) => { if (samples?.length) chunks.push(Int16Array.from(samples)); });
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (length === 0) throw new Error('O sintetizador não gerou áudio.');
    const pcm = new Float32Array(length);
    let offset = 0;
    for (const chunk of chunks) for (const sample of chunk) pcm[offset++] = sample / 32_768;
    parentPort!.postMessage({ id, pcm: pcm.buffer, sampleRate: 22_050 }, [pcm.buffer]);
  } catch (error) {
    parentPort!.postMessage({ id, error: error instanceof Error ? error.message : 'Falha desconhecida na síntese.' });
  }
});
