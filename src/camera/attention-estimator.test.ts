import { describe, expect, it } from 'vitest';
import { AttentionEstimator } from './attention-estimator';
import type { CalibrationProfile, VisionObservation } from './types';

const profile: CalibrationProfile = {
  front: { pitch: 0.3, yaw: 0, roll: 0, faceWidth: 0.3 },
  downPitchDelta: 0.12,
  sideYawThreshold: 0.06,
  createdAt: 1,
};

function observation(
  capturedAt: number,
  values: Partial<VisionObservation> = {},
): VisionObservation {
  return {
    detected: true,
    quality: 0.9,
    capturedAt,
    processingMs: 12,
    metrics: { pitch: 0.3, yaw: 0, roll: 0, faceWidth: 0.3 },
    ...values,
  };
}

describe('AttentionEstimator', () => {
  it('detecta presença sem calibração', () => {
    const estimator = new AttentionEstimator();
    expect(estimator.update(observation(1_000)).candidate).toBe('screen');
    expect(estimator.update(observation(1_800)).signal.status).toBe('screen');
  });

  it('só estabiliza cabeça abaixada após permanência mínima', () => {
    const estimator = new AttentionEstimator();
    estimator.setCalibration(profile);
    const down = { metrics: { pitch: 0.42, yaw: 0, roll: 0, faceWidth: 0.3 } };
    expect(estimator.update(observation(1_000, down)).signal.status).toBe('uncertain');
    expect(estimator.update(observation(2_500, down)).signal.status).toBe('uncertain');
    expect(estimator.update(observation(2_650, down)).signal.status).toBe('down');
  });

  it('não transforma um único frame sem rosto em ausência estável', () => {
    const estimator = new AttentionEstimator();
    estimator.setCalibration(profile);
    const absent = { detected: false, quality: 0, metrics: undefined };
    const first = estimator.update(observation(10_000, absent));
    expect(first.candidate).toBe('absent');
    expect(first.signal.status).toBe('uncertain');
  });

  it('marca explicitamente o sinal como indisponível ao parar a câmera', () => {
    const estimator = new AttentionEstimator();
    estimator.setCalibration(profile);
    const result = estimator.unavailable(20_000);
    expect(result.signal.available).toBe(false);
    expect(result.signal.status).toBe('uncertain');
  });
});
