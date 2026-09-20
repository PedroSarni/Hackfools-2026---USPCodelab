import { randomUUID } from 'node:crypto';
import type { AttentionSignal, FredReaction } from '../../shared/contracts';

const COOLDOWN_MS = 7_000;

export class AttentionReactionController {
  private previousStatus: AttentionSignal['status'] = 'uncertain';
  private lastReactionAt = 0;

  consume(signal: AttentionSignal): FredReaction | null {
    if (!signal.available || !signal.calibrated || signal.source !== 'camera') return null;
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
      delivery: 'pending-fred',
    };
  }

  private reactionFor(
    status: AttentionSignal['status'],
    prior: AttentionSignal['status'],
  ): Pick<FredReaction, 'mood' | 'message'> | null {
    if (status === 'down') {
      return { mood: 'suspicious', message: 'Olhou pra baixo. Espero que seja uma anotação.' };
    }
    if (status === 'away') {
      return { mood: 'suspicious', message: 'Essa direção não foi a que você calibrou como tela.' };
    }
    if (status === 'absent') {
      return { mood: 'disappointed', message: 'Você sumiu e deixou só eu estudando.' };
    }
    if (status === 'screen' && ['down', 'away', 'absent'].includes(prior)) {
      return { mood: 'relieved', message: 'Voltou. Eu já estava contando seus segundos fora.' };
    }
    return null;
  }
}
