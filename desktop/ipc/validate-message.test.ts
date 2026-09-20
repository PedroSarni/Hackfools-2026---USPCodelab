import { describe, expect, it } from 'vitest';
import { validateAttentionSignal, validatePreferencePatch } from './validate-message';

describe('validação IPC', () => {
  it('aceita somente preferências conhecidas e tipadas', () => {
    expect(validatePreferencePatch({ mirrored: false })).toEqual({ mirrored: false });
    expect(() => validatePreferencePatch({ arbitraryChannel: true })).toThrow('desconhecida');
  });

  it('rejeita confiança fora do intervalo', () => {
    expect(() =>
      validateAttentionSignal({
        status: 'screen',
        confidence: 4,
        observedAt: 10,
        stableForMs: 2,
        calibrated: true,
        available: true,
        source: 'camera',
      }),
    ).toThrow('Qualidade');
  });
});
