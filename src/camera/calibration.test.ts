import { describe, expect, it } from 'vitest';
import { CalibrationSession } from './calibration';
import type { PoseMetrics, VisionObservation } from './types';

function sample(metrics: PoseMetrics): VisionObservation {
  return { detected: true, quality: 0.9, capturedAt: Date.now(), processingMs: 10, metrics };
}

function feed(session: CalibrationSession, metrics: PoseMetrics): void {
  for (let index = 0; index < 18; index += 1) session.ingest(sample(metrics));
}

describe('CalibrationSession', () => {
  it('cria referência relativa frontal e para baixo', () => {
    const session = new CalibrationSession();
    session.begin();
    session.startCapture();
    feed(session, { pitch: 0.3, yaw: 0.01, roll: 1, faceWidth: 0.3 });
    expect(session.getProgress().step).toBe('down');

    session.startCapture();
    feed(session, { pitch: 0.42, yaw: 0.01, roll: 1, faceWidth: 0.3 });
    expect(session.getProgress().step).toBe('sides');
    const profile = session.skipSides();
    expect(profile?.downPitchDelta).toBeCloseTo(0.12);
    expect(profile?.sideYawThreshold).toBeCloseTo(0.065);
  });

  it('rejeita uma referência para baixo indistinguível da frontal', () => {
    const session = new CalibrationSession();
    session.begin();
    session.startCapture();
    feed(session, { pitch: 0.3, yaw: 0, roll: 0, faceWidth: 0.3 });
    session.startCapture();
    feed(session, { pitch: 0.31, yaw: 0, roll: 0, faceWidth: 0.3 });
    expect(session.getProgress().error).toContain('parecida');
    expect(session.getProgress().step).toBe('down');
  });
});
