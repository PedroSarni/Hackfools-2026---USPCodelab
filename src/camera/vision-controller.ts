import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { observationFromLandmarks } from './pose-metrics';
import type { VisionObservation } from './types';

const FRAME_INTERVAL_MS = 100;

export class VisionController {
  private faceLandmarker: FaceLandmarker | null = null;
  private readonly canvas = document.createElement('canvas');
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
    const vision = await FilesetResolver.forVisionTasks(new URL('wasm', base).href);
    this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: new URL('face_landmarker.task', base).href, delegate: 'CPU' },
      canvas: this.canvas,
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    this.initialized = true;
  }

  start(): void {
    if (!this.initialized || this.disposed) return;
    this.schedule();
  }

  setDiagnostics(enabled: boolean): void {
    this.diagnostics = enabled;
  }

  stop(): void {
    window.clearTimeout(this.animationFrame);
    this.animationFrame = 0;
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    this.faceLandmarker?.close();
    this.faceLandmarker = null;
    this.initialized = false;
  }

  private schedule = (): void => {
    this.animationFrame = window.setTimeout(() => void this.tick(performance.now()), FRAME_INTERVAL_MS);
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
        window.setTimeout(() => this.processInRenderer(capturedAt), 0);
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
      this.stop();
      this.onError(error instanceof Error ? error.message : 'Falha no detector local.');
    } finally {
      this.frameInFlight = false;
    }
  }

}
