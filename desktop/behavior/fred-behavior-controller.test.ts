import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FredReaction } from '../../shared/contracts';
import { FredBehaviorController } from './fred-behavior-controller';

describe('FredBehaviorController', () => {
  afterEach(() => vi.useRealTimers());

  it('transforma a simulação em reação visual e volta ao humor base', () => {
    vi.useFakeTimers();
    const reactions: FredReaction[] = [];
    const controller = new FredBehaviorController((reaction) => reactions.push(reaction));

    expect(controller.simulate('study')).toEqual({ accepted: true });
    expect(reactions.at(-1)).toMatchObject({ mood: 'observing', source: 'simulation', delivery: 'fred' });

    controller.simulate('complete');
    expect(reactions.at(-1)?.mood).toBe('happy');
    vi.advanceTimersByTime(6_500);
    expect(reactions.at(-1)).toMatchObject({ mood: 'observing', source: 'idle' });
    controller.dispose();
  });

  it('usa a fala específica quando o usuário flagra o Fred scrollando', () => {
    const reactions: FredReaction[] = [];
    const controller = new FredBehaviorController((reaction) => reactions.push(reaction));
    controller.caughtScrolling();
    expect(reactions[0]).toMatchObject({ mood: 'observing', source: 'hover' });
    expect(reactions[0]?.message).toContain('tava scrollando');
    controller.dispose();
  });
});
