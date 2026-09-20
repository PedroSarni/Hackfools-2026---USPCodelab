import { describe, expect, it } from 'vitest';
import type { AttentionSignal } from '../../shared/contracts';
import { AttentionReactionController } from './attention-reaction-controller';

function signal(status: AttentionSignal['status'], observedAt: number): AttentionSignal {
  return {
    status,
    observedAt,
    confidence: 0.8,
    stableForMs: 2_000,
    calibrated: false,
    available: true,
    source: 'camera',
  };
}

describe('AttentionReactionController', () => {
  it('emite uma reação destinada ao Fred', () => {
    const controller = new AttentionReactionController();
    const reaction = controller.consume(signal('absent', 10_000));
    expect(reaction?.delivery).toBe('fred');
    expect(reaction?.message).toContain('volta aqui');
    expect(controller.consume(signal('absent', 11_000))).toBeNull();
  });

  it('ignora direção do olhar', () => {
    const controller = new AttentionReactionController();
    expect(controller.consume(signal('down', 10000))).toBeNull();
    expect(controller.consume(signal('away', 20000))).toBeNull();
  });

  it('não acusa durante sinal incerto', () => {
    const controller = new AttentionReactionController();
    expect(controller.consume(signal('uncertain', 10_000))).toBeNull();
  });
});
