import { afterEach, describe, expect, it, vi } from 'vitest';
import { FredIdleController } from './fred-idle-controller';

describe('FredIdleController', () => {
  afterEach(() => vi.useRealTimers());

  it('scrolla no ócio e se recompõe quando o mouse chega', () => {
    vi.useFakeTimers();
    const activities: boolean[] = [];
    const caught = vi.fn();
    const controller = new FredIdleController(() => true, (value) => activities.push(value), caught, () => 0, 1_000);

    vi.advanceTimersByTime(1_000);
    expect(activities).toEqual([true]);
    controller.hover(true);
    expect(activities).toEqual([true, false]);
    expect(caught).toHaveBeenCalledOnce();
    controller.dispose();
  });
});
