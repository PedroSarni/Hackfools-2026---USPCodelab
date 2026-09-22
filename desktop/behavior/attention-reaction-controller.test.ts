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

  it('avisa ao abaixar a cabeça e ignora olhares laterais', () => {
    const controller = new AttentionReactionController();
    expect(controller.consume(signal('down', 10000))?.message).toBe('Eu espero que isso seja um livro');
    expect(controller.consume(signal('down', 11000))).toBeNull();
    expect(controller.consume(signal('away', 20000))).toBeNull();
  });

  it('entrega o aviso pendente depois do cooldown', () => {
    const controller = new AttentionReactionController();
    controller.consume(signal('absent', 10000));
    expect(controller.consume(signal('down', 12000))).toBeNull();
    expect(controller.consume(signal('down', 18000))?.mood).toBe('angry');
  });

  it('não acusa durante sinal incerto', () => {
    const controller = new AttentionReactionController();
    expect(controller.consume(signal('uncertain', 10_000))).toBeNull();
  });

  it('permite um novo aviso depois de retornar à tela durante o cooldown', () => {
    const controller = new AttentionReactionController();
    expect(controller.consume(signal('down', 10000))).not.toBeNull();
    controller.consume(signal('screen', 12000));
    expect(controller.consume(signal('down', 18000))).not.toBeNull();
  });
});
