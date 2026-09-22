import { randomUUID } from 'node:crypto';
import type { AttentionSignal, FredReaction } from '../../shared/contracts';

const COOLDOWN_MS = 7_000;

export class AttentionReactionController {
  private previousStatus: AttentionSignal['status'] = 'uncertain';
  private lastReactionAt = -Infinity;
  private pending: Pick<FredReaction, 'mood' | 'message'> | null = null;

  consume(signal: AttentionSignal): FredReaction | null {
    if (!signal.available || signal.source !== 'camera') {
      this.pending = null;
      this.previousStatus = 'uncertain';
      return null;
    }
    if (signal.status !== this.previousStatus) {
      this.pending = this.reactionFor(signal.status, this.previousStatus);
      this.previousStatus = signal.status;
    }
    const now = signal.observedAt;
    if (now - this.lastReactionAt < COOLDOWN_MS) return null;
    const specification = this.pending;
    if (!specification) return null;
    this.pending = null;
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
    if (status === 'down') {
      return { mood: 'angry', message: 'Eu espero que isso seja um livro' };
    }

    if (status === 'absent') {
      return { mood: 'disappointed', message: 'Ei, volta aqui! Ainda temos o que estudar.' };
    }
    if (status === 'screen' && prior === 'absent') {
      return { mood: 'observing', message: 'Boa, você voltou! Vamos continuar.' };
    }
    return null;
  }
}
