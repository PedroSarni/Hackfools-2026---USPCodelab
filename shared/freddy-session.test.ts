import { describe, expect, it } from 'vitest';
import { initialAcademy } from './academy';
import { canDismissFreddy, sessionReels } from './freddy-session';
import type { ReelAsset } from './contracts';

const reels = [1, 2, 3, 4, 5, 7, 9, 10].map(n => ({
  id: String(n), fileName: `reels${String(n).padStart(2, '0')}.mp4`,
})) as ReelAsset[];

describe('sessão do Freddy', () => {
  it('mostra só os dois primeiros antes de iniciar e todos durante a fiscalização', () => {
    expect(sessionReels(reels, 'waiting')).toEqual(reels.slice(0, 2));
    expect(sessionReels(reels, 'active')).toEqual(reels);
  });
  it('remove os reels 03, 05 e 09 após a despedida', () => {
    expect(sessionReels(reels, 'retired').map(r => r.id)).toEqual(['1', '2', '4', '7', '10']);
  });
  it('exige todas as tarefas, inclusive as adicionais', () => {
    const state = initialAcademy();
    expect(canDismissFreddy(state)).toBe(false);
    state.missions.forEach(m => { m.completedAt = '2026-09-20'; });
    expect(canDismissFreddy(state)).toBe(true);
    state.missions.push({ ...state.missions[0], id: 'extra', completedAt: null });
    expect(canDismissFreddy(state)).toBe(false);
    state.missions = [];
    expect(canDismissFreddy(state)).toBe(false);
  });
});
