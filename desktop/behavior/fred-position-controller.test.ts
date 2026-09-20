import { describe, expect, it } from 'vitest';
import { FRED_SIZE, chooseFredPosition } from './fred-position-controller';

describe('chooseFredPosition', () => {
  it('prefere o canto inferior direito quando está discreto', () => {
    expect(chooseFredPosition({ x: 0, y: 0, width: 1_000, height: 800 }, 'discreet')).toEqual({
      x: 740, y: 442, ...FRED_SIZE,
    });
  });

  it('evita uma janela que ocupa o canto preferido', () => {
    const chosen = chooseFredPosition(
      { x: 0, y: 0, width: 1_000, height: 800 },
      'discreet',
      [{ x: 650, y: 330, width: 350, height: 470 }],
    );
    expect(chosen.x).toBe(18);
    expect(chosen.y).toBe(442);
  });
});
