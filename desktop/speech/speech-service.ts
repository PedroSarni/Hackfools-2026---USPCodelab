import { join } from 'node:path';
import { Worker } from 'node:worker_threads';

interface SpeechResult { id: number; pcm?: ArrayBuffer; sampleRate?: number; error?: string; }

export class SpeechService {
  private worker?: Worker;
  private sequence = 0;
  private active = false;
  private pending?: { id: number; text: string };
  private disposed = false;

  constructor(
    private readonly onAudio: (result: { id: number; pcm: ArrayBuffer; sampleRate: number }) => void,
    private readonly onStatus: (status: 'idle' | 'generating' | 'ready' | 'error') => void,
  ) {}

  speak(text: string): number {
    if (!text.trim() || text.length > 500) throw new Error('Fala inválida.');
    const id = ++this.sequence;
    this.pending = { id, text };
    this.onStatus('generating');
    this.pump();
    return id;
  }

  cancel(): void {
    this.sequence += 1;
    this.pending = undefined;
    this.onStatus('idle');
  }

  dispose(): void {
    this.disposed = true;
    this.pending = undefined;
    void this.worker?.terminate();
  }

  private pump(): void {
    if (this.active || !this.pending || this.disposed) return;
    this.worker ??= this.createWorker();
    this.active = true;
    const request = this.pending;
    this.pending = undefined;
    this.worker.postMessage(request);
  }

  private createWorker(): Worker {
    const worker = new Worker(join(__dirname, 'speech-worker.js'));
    worker.on('message', (result: SpeechResult) => {
      this.active = false;
      if (result.id === this.sequence) {
        if (result.error || !result.pcm || !result.sampleRate) this.onStatus('error');
        else {
          this.onAudio({ id: result.id, pcm: result.pcm, sampleRate: result.sampleRate });
          this.onStatus('ready');
        }
      }
      this.pump();
    });
    worker.on('error', (error) => {
      console.warn('Voz do Freddy indisponível.', error);
      this.active = false;
      this.pending = undefined;
      this.worker = undefined;
      this.onStatus('error');
    });
    return worker;
  }
}
