import type { AttentionStatus } from '../../shared/contracts';
import type { AttentionEstimate, CalibrationProfile, PoseMetrics, VisionObservation } from './types';

const MIN_QUALITY = 0.45;
const MINIMUM_DURATION: Record<AttentionStatus, number> = {
  screen: 700,
  down: 1_600,
  away: 1_700,
  absent: 2_300,
  uncertain: 900,
};

export class AttentionEstimator {
  private profile: CalibrationProfile | null = null;
  private smoothed: PoseMetrics | null = null;
  private status: AttentionStatus = 'uncertain';
  private statusSince = 0;
  private candidate: AttentionStatus = 'uncertain';
  private candidateSince = 0;

  setCalibration(profile: CalibrationProfile): void {
    this.profile = profile;
    this.smoothed = null;
    this.status = 'uncertain';
    this.statusSince = 0;
    this.candidate = 'uncertain';
    this.candidateSince = 0;
  }

  clearCalibration(): void {
    this.profile = null;
    this.smoothed = null;
  }

  update(observation: VisionObservation): AttentionEstimate {
    const now = observation.capturedAt;
    if (observation.metrics) this.smoothed = smooth(this.smoothed, observation.metrics, 0.28);
    const raw = this.classify(observation);

    if (raw !== this.candidate) {
      this.candidate = raw;
      this.candidateSince = now;
    }
    if (!this.statusSince) this.statusSince = now;
    if (now - this.candidateSince >= MINIMUM_DURATION[this.candidate] && this.status !== this.candidate) {
      this.status = this.candidate;
      this.statusSince = now;
    }

    return {
      signal: {
        status: this.status,
        confidence: observation.quality,
        observedAt: now,
        stableForMs: Math.max(0, now - this.statusSince),
        calibrated: this.profile !== null,
        available: true,
        source: 'camera',
      },
      candidate: this.candidate,
      candidateForMs: Math.max(0, now - this.candidateSince),
    };
  }

  unavailable(now = Date.now()): AttentionEstimate {
    this.smoothed = null;
    this.status = 'uncertain';
    this.candidate = 'uncertain';
    this.statusSince = now;
    this.candidateSince = now;
    return {
      signal: {
        status: 'uncertain',
        confidence: 0,
        observedAt: now,
        stableForMs: 0,
        calibrated: this.profile !== null,
        available: false,
        source: 'camera',
      },
      candidate: 'uncertain',
      candidateForMs: 0,
    };
  }

  private classify(observation: VisionObservation): AttentionStatus {
    if (!observation.detected) return 'absent';
    if (!this.profile) return observation.quality >= MIN_QUALITY ? 'screen' : 'uncertain';
    if (!observation.metrics || observation.quality < MIN_QUALITY || !this.smoothed) {
      return 'uncertain';
    }

    const downProgress =
      (this.smoothed.pitch - this.profile.front.pitch) / this.profile.downPitchDelta;
    const downThreshold = this.status === 'down' ? 0.35 : 0.58;
    if (downProgress >= downThreshold) return 'down';

    const yawDelta = Math.abs(this.smoothed.yaw - this.profile.front.yaw);
    const yawThreshold = this.profile.sideYawThreshold * (this.status === 'away' ? 0.7 : 1);
    if (yawDelta >= yawThreshold) return 'away';
    return 'screen';
  }
}

function smooth(previous: PoseMetrics | null, current: PoseMetrics, alpha: number): PoseMetrics {
  if (!previous) return current;
  return {
    pitch: interpolate(previous.pitch, current.pitch, alpha),
    yaw: interpolate(previous.yaw, current.yaw, alpha),
    roll: interpolate(previous.roll, current.roll, alpha),
    faceWidth: interpolate(previous.faceWidth, current.faceWidth, alpha),
  };
}

function interpolate(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}
