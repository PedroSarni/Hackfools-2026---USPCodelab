import { randomUUID } from 'node:crypto';
import type { AttentionSignal, FredReaction } from '../../shared/contracts';

const COOLDOWN_MS = 7_000;

export class AttentionReactionController {
  private previousStatus: AttentionSignal['status'] = 'uncertain';
  private lastReactionAt = 0;

  consume(signal: AttentionSignal): FredReaction | null {
    if (!signal.available || signal.source !== 'camera') return null;
    if (signal.status === this.previousStatus) return null;

    const prior = this.previousStatus;
    this.previousStatus = signal.status;
    const now = signal.observedAt;
    if (signal.status === 'uncertain' || now - this.lastReactionAt < COOLDOWN_MS) return null;

    const specification = this.reactionFor(signal.status, prior);
    if (!specification) return null;
    this.lastReactionAt = now;
    return {
      reactionId: randomUUID(),
      ...specification,
      priority: signal.status === 'absent' ? 80 : 60,
      durationMs: 4_500,
      source: 'camera',
      delivery: 'fred',
    };
  }

  private reactionFor(
    status: AttentionSignal['status'],
    prior: AttentionSignal['status'],
  ): Pick<FredReaction, 'mood' | 'message'> | null {

    if (status === 'absent') {
      return { mood: 'disappointed', message: 'Ei, volta aqui! Ainda temos slides para estudar.' };
    }
    if (status === 'screen' && prior === 'absent') {
      return { mood: 'observing', message: 'Boa, você voltou! Vamos continuar.' };
    }
    return null;
  }
}
