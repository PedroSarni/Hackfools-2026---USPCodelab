import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { observationFromLandmarks } from './pose-metrics';
import type { VisionObservation, VisionWorkerRequest, VisionWorkerResponse } from './types';

const FRAME_INTERVAL_MS = 100;

export class VisionController {
  private worker: Worker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private backend: 'worker' | 'renderer' = 'worker';
  private initialized = false;
  private frameInFlight = false;
  private lastFrameAt = 0;
  private disposed = false;
  private animationFrame = 0;
  private diagnostics = true;

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly onObservation: (observation: VisionObservation) => void,
    private readonly onError: (message: string) => void,
  ) {}

  async initialize(): Promise<void> {
    const base = new URL('./models/', window.location.href);
    this.worker = new Worker(new URL('./vision-worker.ts', import.meta.url), { type: 'module' });
    try {
      await this.initializeWorker(base);
      this.worker.addEventListener('message', this.handleMessage);
    } catch (workerError) {
      console.warn('Worker do MediaPipe indisponível; usando agendador local sem fila.', workerError);
      this.worker.terminate();
      this.worker = null;
      this.backend = 'renderer';
      const vision = await FilesetResolver.forVisionTasks(new URL('wasm', base).href);
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: new URL('face_landmarker.task', base).href, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
    }
    this.initialized = true;
  }

  private initializeWorker(base: URL): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const initializationHandler = (event: MessageEvent<VisionWorkerResponse>): void => {
        if (event.data.type === 'initialized') {
          this.worker?.removeEventListener('message', initializationHandler);
          resolve();
        } else if (event.data.type === 'error' && event.data.fatal) {
          this.worker?.removeEventListener('message', initializationHandler);
          reject(new Error(event.data.message));
        }
      };
      this.worker?.addEventListener('message', initializationHandler);
      this.worker?.postMessage({
        type: 'init',
        wasmBaseUrl: new URL('wasm', base).href,
        modelUrl: new URL('face_landmarker.task', base).href,
      } satisfies VisionWorkerRequest);
    });
  }

  start(): void {
    if (!this.initialized || this.disposed) return;
    this.schedule();
  }

  setDiagnostics(enabled: boolean): void {
    this.diagnostics = enabled;
  }

  stop(): void {
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    this.faceLandmarker?.close();
    this.faceLandmarker = null;
    this.worker?.postMessage({ type: 'dispose' } satisfies VisionWorkerRequest);
    this.worker?.terminate();
    this.worker = null;
  }

  private schedule = (): void => {
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private tick = async (now: number): Promise<void> => {
    if (this.disposed) return;
    if (
      !this.frameInFlight &&
      now - this.lastFrameAt >= FRAME_INTERVAL_MS &&
      this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      this.frameInFlight = true;
      this.lastFrameAt = now;
      try {
        const capturedAt = performance.timeOrigin + now;
        if (this.backend === 'worker' && this.worker) {
          const bitmap = await createImageBitmap(this.video);
          this.worker.postMessage(
            { type: 'frame', bitmap, capturedAt, diagnostics: this.diagnostics } satisfies VisionWorkerRequest,
            [bitmap],
          );
        } else {
          window.setTimeout(() => this.processInRenderer(capturedAt), 0);
        }
      } catch (error) {
        this.frameInFlight = false;
        this.onError(error instanceof Error ? error.message : 'Não foi possível capturar o frame.');
      }
    }
    this.schedule();
  };

  private processInRenderer(capturedAt: number): void {
    try {
      if (!this.faceLandmarker || this.disposed) return;
      const started = performance.now();
      const result = this.faceLandmarker.detectForVideo(this.video, capturedAt);
      this.onObservation(
        observationFromLandmarks(
          result.faceLandmarks[0],
          capturedAt,
          performance.now() - started,
          this.diagnostics,
        ),
      );
    } catch (error) {
      this.onError(error instanceof Error ? error.message : 'Falha no detector local.');
    } finally {
      this.frameInFlight = false;
    }
  }

  private handleMessage = (event: MessageEvent<VisionWorkerResponse>): void => {
    if (event.data.type === 'result') {
      this.frameInFlight = false;
      this.onObservation(event.data.observation);
    } else if (event.data.type === 'error') {
      this.frameInFlight = false;
      this.onError(event.data.message);
    }
  };
}
