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
 it('bloqueia saldo insuficiente e recursos ausentes', () => {
  expect(() => reduceAcademy(initialAcademy(), { type: 'shop.buy', id: 'lavender' })).toThrow('Saldo insuficiente');
  expect(() => reduceAcademy(initialAcademy(), { type: 'shop.buy', id: 'brainrot' })).toThrow('depende');
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
 it('excluir matéria preserva missão e prazo sem vínculo órfão', () => {
  let s = reduceAcademy(initialAcademy(), { type: 'subject.save', value: { id: 'math', name: 'Cálculo', color: '#aabbcc' } });
  s = reduceAcademy(s, { type: 'mission.save', value: { ...mission('one'), subjectId: 'math' } });
  s = reduceAcademy(s, { type: 'subject.delete', id: 'math' }); expect(s.missions[0].subjectId).toBe('');
 });
});
