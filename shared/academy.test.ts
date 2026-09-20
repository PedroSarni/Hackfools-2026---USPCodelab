import { describe, expect, it } from 'vitest';
import { balanceOf, initialAcademy, reduceAcademy, type Mission } from './academy';
const mission = (id: string, criterion: Mission['criterion'] = 'manual'): Mission => ({ id, title: 'Revisão', subjectId: '', due: '2026-09-20T18:00', criterion, target: 20, material: '', pages: '', completedAt: null });
describe('Missões e carteira', () => {
 it('recompensa somente uma vez, inclusive após exclusão e recriação do mesmo id', () => {
  let s = reduceAcademy(initialAcademy(), { type: 'mission.save', value: mission('one') });
  s = reduceAcademy(s, { type: 'mission.complete', id: 'one' });
  s = reduceAcademy(s, { type: 'mission.complete', id: 'one' });
  s = reduceAcademy(s, { type: 'mission.delete', id: 'one' });
  s = reduceAcademy(s, { type: 'mission.save', value: mission('one') });
  s = reduceAcademy(s, { type: 'mission.complete', id: 'one' });
  expect(balanceOf(s)).toBe(50); expect(s.transactions).toHaveLength(1);
 });
 it.each(['minutes','pages'] as const)('não concede moedas por %s sem registros', criterion => {
  const s = reduceAcademy(initialAcademy(), { type: 'mission.save', value: mission('one', criterion) });
  expect(() => reduceAcademy(s, { type: 'mission.complete', id: 'one' })).toThrow('Requisito pendente'); expect(balanceOf(s)).toBe(0);
 });
 it('bloqueia saldo insuficiente e itens não resgatados', () => {
  expect(() => reduceAcademy(initialAcademy(), { type: 'shop.buy', id: 'lavender' })).toThrow('Saldo insuficiente');
  expect(() => reduceAcademy(initialAcademy(), { type: 'shop.equip', id: 'ocean' })).toThrow('Resgate');
 });
 it('compra uma vez, equipa e desativa', () => {
  let s = initialAcademy();
  for (const id of ['a','b']) { s = reduceAcademy(s, { type: 'mission.save', value: mission(id) }); s = reduceAcademy(s, { type: 'mission.complete', id }); }
  s = reduceAcademy(s, { type: 'shop.buy', id: 'lavender' }); s = reduceAcademy(s, { type: 'shop.buy', id: 'lavender' });
  expect(balanceOf(s)).toBe(0); expect(s.owned).toEqual(['lavender']);
  s = reduceAcademy(s, { type: 'shop.equip', id: 'lavender' }); expect(s.equipped).toBe('lavender');
  s = reduceAcademy(s, { type: 'shop.equip', id: null }); expect(s.equipped).toBeNull();
 });
 it('libera bônus repetível de 100 moedas para a demonstração', () => {
  let state = reduceAcademy(initialAcademy(), { type: 'wallet.bonus' }, '2026-09-20T12:00:00.000Z');
  state = reduceAcademy(state, { type: 'wallet.bonus' }, '2026-09-20T12:00:00.000Z');
  expect(balanceOf(state)).toBe(200);
  expect(state.transactions.at(-1)?.reason).toContain('FreddyBuddy');
 });
 it('excluir matéria preserva missão e prazo sem vínculo órfão', () => {
  let s = reduceAcademy(initialAcademy(), { type: 'subject.save', value: { id: 'math', name: 'Cálculo', color: '#aabbcc' } });
  s = reduceAcademy(s, { type: 'mission.save', value: { ...mission('one'), subjectId: 'math' } });
  s = reduceAcademy(s, { type: 'subject.delete', id: 'math' }); expect(s.missions.find(item => item.id === 'one')?.subjectId).toBe('');
 });
 it('carrega a grade obrigatória do segundo período e impede exclusão', () => {
  const state = initialAcademy();
  expect(state.subjects.map(subject => subject.id)).toEqual(expect.arrayContaining(['jupiter-scc0502', 'jupiter-sma0501', 'jupiter-ssc0503', 'jupiter-ssc0513', 'jupiter-ssc0532']));
  expect(state.missions.find(item => item.id === 'jupiter-pilhas')?.material).toContain('Reels');
  expect(() => reduceAcademy(state, { type: 'mission.delete', id: 'jupiter-pilhas' })).toThrow('obrigatória');
 });
 it('aumenta o vídeo proporcionalmente cobrando cada nível uma única vez', () => {
  let s = initialAcademy();
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
   s = reduceAcademy(s, { type: 'mission.save', value: mission(id) });
   s = reduceAcademy(s, { type: 'mission.complete', id });
  }
  expect(balanceOf(s)).toBe(300);
  s = reduceAcademy(s, { type: 'study-video.upgrade' });
  expect(s.studyVideoLevel).toBe(1); expect(balanceOf(s)).toBe(250);
  s = reduceAcademy(s, { type: 'study-video.upgrade' });
  expect(s.studyVideoLevel).toBe(2); expect(balanceOf(s)).toBe(150);
  expect(() => reduceAcademy(s, { type: 'study-video.upgrade' })).toThrow('200 Study Coins');
  s = reduceAcademy(s, { type: 'wallet.bonus' });
  s = reduceAcademy(s, { type: 'study-video.upgrade' });
  expect(s.studyVideoLevel).toBe(3); expect(balanceOf(s)).toBe(50);
 });
});
