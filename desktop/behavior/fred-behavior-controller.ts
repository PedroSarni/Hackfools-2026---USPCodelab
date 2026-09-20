import { randomUUID } from 'node:crypto';
import type { FredMood, FredPositionIntent, FredReaction, FredSimulation } from '../../shared/contracts';

const SIMULATIONS: Record<FredSimulation, { mood: FredMood; intent: FredPositionIntent; message: string; durationMs: number }> = {
  study: { mood: 'observing', intent: 'discreet', message: 'Abriu o material? Vou ficar aqui. Discretíssimo.', durationMs: 7_000 },
  distraction: { mood: 'angry', intent: 'attention', message: 'Você disse “só mais um vídeo” faz três vídeos.', durationMs: 6_500 },
  absent: { mood: 'disappointed', intent: 'attention', message: 'Você sumiu e deixou só eu estudando.', durationMs: 6_500 },
  complete: { mood: 'happy', intent: 'celebrate', message: 'Aí sim! Senti esse progresso nos ossos.', durationMs: 6_500 },
  rest: { mood: 'resting', intent: 'rest', message: 'Pausa merecida. Até os ossos precisam relaxar.', durationMs: 0 },
  return: { mood: 'observing', intent: 'discreet', message: 'Voltou! Eu já tava juntando os seus ossos.', durationMs: 6_500 },
};

const MOOD_INTENTS: Record<FredMood, FredPositionIntent> = {
  idle: 'discreet', observing: 'discreet', happy: 'celebrate', angry: 'attention', disappointed: 'attention', resting: 'rest',
};

export class FredBehaviorController {
  private timer?: NodeJS.Timeout;
  private baseline: FredMood = 'idle';
  private lastEvent?: FredSimulation;
  private lastEventAt = 0;

  constructor(private readonly emit: (reaction: FredReaction, intent: FredPositionIntent) => void) {}

  simulate(event: FredSimulation): { accepted: boolean } {
    const now = Date.now();
    if (event === this.lastEvent && now - this.lastEventAt < 900) return { accepted: false };
    this.lastEvent = event;
    this.lastEventAt = now;
    if (event === 'study' || event === 'return') this.baseline = 'observing';
    if (event === 'rest') this.baseline = 'resting';
    const specification = SIMULATIONS[event];
    this.deliver(specification.mood, specification.message, 'simulation', specification.intent, specification.durationMs);
    return { accepted: true };
  }

  preview(mood: FredMood): void {
    this.deliver(mood, this.defaultMessage(mood), 'manual', MOOD_INTENTS[mood], 0);
  }

  camera(reaction: FredReaction): void {
    const intent: FredPositionIntent = reaction.mood === 'happy' ? 'celebrate' : reaction.mood === 'observing' ? 'discreet' : 'attention';
    this.deliver(reaction.mood, reaction.message, 'camera', intent, reaction.durationMs, reaction.priority);
  }

  caughtScrolling(): void {
    this.deliver('observing', 'Opa, desculpa, tava scrollando aqui. Já voltei!', 'hover', 'discreet', 5_000, 70);
  }

  dispose(): void { clearTimeout(this.timer); }

  private deliver(
    mood: FredMood,
    message: string,
    source: FredReaction['source'],
    intent: FredPositionIntent,
    durationMs: number,
    priority = 50,
  ): void {
    clearTimeout(this.timer);
    this.emit({ reactionId: randomUUID(), mood, message, priority, durationMs, source, delivery: 'fred' }, intent);
    if (durationMs > 0) {
      this.timer = setTimeout(() => {
        this.emit({
          reactionId: randomUUID(), mood: this.baseline, message: this.defaultMessage(this.baseline), priority: 0,
          durationMs: 0, source: 'idle', delivery: 'fred',
        }, MOOD_INTENTS[this.baseline]);
      }, durationMs);
    }
  }

  private defaultMessage(mood: FredMood): string {
    return {
      idle: 'Freddy na área. Abre o PDF que eu fico de olho.',
      observing: 'Não tenho retina, mas tô de olho.',
      happy: 'Aí sim! Senti esse progresso nos ossos.',
      angry: 'Você disse “só mais um vídeo” faz três vídeos.',
      disappointed: 'Quando você disse “já vou estudar”, eu ainda tinha pele.',
      resting: 'Pausa merecida. Até os ossos precisam relaxar.',
    }[mood];
  }
}
