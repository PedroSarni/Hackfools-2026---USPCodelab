import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { AcademyService } from './academy-service';
it('serializa conclusões concorrentes e reabre o saldo persistido', async () => {
 const dir = await mkdtemp(join(tmpdir(), 'baistudy-test-')); const path = join(dir, 'academy.json');
 try {
  const service = new AcademyService(path); await service.load();
  await service.dispatch({ type: 'mission.save', value: { id: 'one', title: 'Relatório', subjectId: '', due: '2026-09-20T18:00', criterion: 'manual', target: 1, material: '', pages: '', completedAt: null } });
  await Promise.all(Array.from({ length: 10 }, () => service.dispatch({ type: 'mission.complete', id: 'one' })));
  const reopened = new AcademyService(path); await reopened.load();
  expect(reopened.getState()).toEqual(service.getState()); expect(reopened.getState().transactions).toHaveLength(1);
  expect(JSON.parse(await readFile(path, 'utf8')).transactions[0].amount).toBe(50);
  const restarted = new AcademyService(path); await restarted.load(true);
  expect(restarted.getState().missions.every(m => m.completedAt === null)).toBe(true);
  expect(restarted.getState().transactions).toEqual([]);
  expect(restarted.getState().missions.some(m => m.id === 'one')).toBe(true);
  await restarted.dispatch({ type: 'mission.complete', id: 'one' });
  expect(restarted.getState().transactions).toHaveLength(1);
 } finally { await rm(dir, { recursive: true, force: true }); }
});
