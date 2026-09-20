import type { CalibrationProfile, PoseMetrics, VisionObservation } from './types';

export type CalibrationStep = 'idle' | 'front' | 'down' | 'sides' | 'complete';

const REQUIRED_SAMPLES = 18;

export interface CalibrationProgress {
  step: CalibrationStep;
  capturing: boolean;
  collected: number;
  required: number;
  error?: string;
}

export class CalibrationSession {
  private step: CalibrationStep = 'idle';
  private samples: PoseMetrics[] = [];
  private front?: PoseMetrics;
  private downDelta?: number;
  private sideDeltas: number[] = [];
  private error?: string;
  private capturing = false;

  begin(): void {
    this.step = 'front';
    this.samples = [];
    this.front = undefined;
    this.downDelta = undefined;
    this.sideDeltas = [];
    this.error = undefined;
    this.capturing = false;
  }

  startCapture(): void {
    if (['front', 'down', 'sides'].includes(this.step)) {
      this.samples = [];
      this.error = undefined;
      this.capturing = true;
    }
  }

  ingest(observation: VisionObservation): CalibrationProfile | null {
    if (!this.capturing || !['front', 'down', 'sides'].includes(this.step) || !observation.metrics || observation.quality < 0.55) {
      return null;
    }
    this.samples.push(observation.metrics);
    if (this.samples.length < REQUIRED_SAMPLES) return null;

    const median = medianMetrics(this.samples);
    this.samples = [];
    if (this.step === 'front') {
      this.front = median;
      this.step = 'down';
      this.capturing = false;
      return null;
    }
    if (this.step === 'down' && this.front) {
      const delta = median.pitch - this.front.pitch;
      if (Math.abs(delta) < 0.025) {
        this.error = 'A referência para baixo ficou parecida com a frontal. Repita inclinando a cabeça com clareza.';
        this.capturing = false;
        return null;
      }
      this.downDelta = delta;
      this.step = 'sides';
      this.capturing = false;
      return null;
    }
    if (this.step === 'sides' && this.front && this.downDelta !== undefined) {
      this.sideDeltas.push(Math.abs(median.yaw - this.front.yaw));
      this.capturing = false;
      return this.finish();
    }
    return null;
  }

  skipSides(): CalibrationProfile | null {
    if (this.step !== 'sides') return null;
    return this.finish();
  }

  getProgress(): CalibrationProgress {
    return {
      step: this.step,
      capturing: this.capturing,
      collected: this.samples.length,
      required: REQUIRED_SAMPLES,
      ...(this.error ? { error: this.error } : {}),
    };
  }

  private finish(): CalibrationProfile | null {
    if (!this.front || this.downDelta === undefined) return null;
    this.step = 'complete';
    this.capturing = false;
    const observedSideDelta = this.sideDeltas.length ? median(this.sideDeltas) * 0.55 : 0.065;
    return {
      front: this.front,
      downPitchDelta: this.downDelta,
      sideYawThreshold: Math.max(0.04, observedSideDelta),
      createdAt: Date.now(),
    };
  }
}

function medianMetrics(samples: PoseMetrics[]): PoseMetrics {
  return {
    pitch: median(samples.map((sample) => sample.pitch)),
    yaw: median(samples.map((sample) => sample.yaw)),
    roll: median(samples.map((sample) => sample.roll)),
    faceWidth: median(samples.map((sample) => sample.faceWidth)),
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
