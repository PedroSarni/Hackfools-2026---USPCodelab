import { describe, expect, it } from 'vitest';
import { balanceOf, initialAcademy, reduceAcademy } from './academy';
import { MATERIAL_PROOFS, type MaterialProof, type MaterialRequirement } from './material-checks';

function validProof(requirement: MaterialRequirement): MaterialProof {
  const checked = requirement.items;
  switch (requirement.method) {
    case 'checklist': return { method: 'checklist', checked };
    case 'text': return { method: 'text', checked, text: 'Resoluções nas páginas 42 a 45 do caderno.' };
    case 'link': return { method: 'link', checked, url: 'https://example.com/backlog' };
    case 'file': return { method: 'file', checked, fileName: `entrega${requirement.accept?.split(',')[0]}`, fileSize: 1024 };
  }
}

describe('comprovação dos materiais', () => {
  for (const [id, requirement] of Object.entries(MATERIAL_PROOFS)) {
    it(`valida a comprovação ${requirement.method}: ${id}`, () => {
      const state = initialAcademy();
      expect(() => reduceAcademy(state, { type: 'mission.complete', id })).toThrow('comprovação');
      const action = { type: 'mission.complete' as const, id, proof: validProof(requirement) };
      const completed = reduceAcademy(state, action);
      expect(completed.missions.find(m => m.id === id)?.completedAt).toBeTruthy();
      expect(balanceOf(reduceAcademy(completed, action))).toBe(50);
    });
  }

  it('usa uma forma diferente para cada material', () => {
    expect(new Set(Object.values(MATERIAL_PROOFS).map(requirement => requirement.method)).size).toBe(4);
  });

  it('só conclui Pilhas depois do último slide', () => {
    const state = initialAcademy();
    expect(() => reduceAcademy(state, { type: 'mission.complete', id: 'jupiter-pilhas' })).toThrow('último slide');
    expect(reduceAcademy(state, { type: 'mission.complete', id: 'jupiter-pilhas', proof: { slidesCompleted: true } })
      .missions.find(m => m.id === 'jupiter-pilhas')?.completedAt).toBeTruthy();
  });
});
