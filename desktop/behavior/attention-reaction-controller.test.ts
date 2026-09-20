import { describe, expect, it } from 'vitest';
import type { AttentionSignal } from '../../shared/contracts';
import { AttentionReactionController } from './attention-reaction-controller';

function signal(status: AttentionSignal['status'], observedAt: number): AttentionSignal {
  return {
    status,
    observedAt,
    confidence: 0.8,
    stableForMs: 2_000,
    calibrated: true,
    available: true,
    source: 'camera',
  };
}

describe('AttentionReactionController', () => {
  it('emite uma reação pendente sem implementar Fred', () => {
    const controller = new AttentionReactionController();
    const reaction = controller.consume(signal('down', 10_000));
    expect(reaction?.delivery).toBe('pending-fred');
    expect(reaction?.message).toContain('Olhou pra baixo');
    expect(controller.consume(signal('down', 11_000))).toBeNull();
  });

  it('não acusa durante sinal incerto', () => {
    const controller = new AttentionReactionController();
    expect(controller.consume(signal('uncertain', 10_000))).toBeNull();
  });
});
