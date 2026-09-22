export type MaterialProof =
  | { method: 'checklist'; checked: string[] }
  | { method: 'file'; checked: string[]; fileName: string; fileSize: number }
  | { method: 'text'; checked: string[]; text: string }
  | { method: 'link'; checked: string[]; url: string };

export type MaterialRequirement = {
  method: MaterialProof['method'];
  description: string;
  items: string[];
  accept?: string;
  fieldLabel?: string;
  placeholder?: string;
};

export const MATERIAL_PROOFS: Record<string, MaterialRequirement> = {
  'jupiter-calculo': {
    method: 'text',
    description: 'Registre onde você fez a lista para manter um comprovante simples da atividade.',
    items: ['Resolvi os seis exercícios da lista', 'Registrei as etapas dos cálculos'],
    fieldLabel: 'Onde estão suas resoluções?',
    placeholder: 'Ex.: páginas 42–45 do caderno azul',
  },
  'jupiter-ponteiros': {
    method: 'file',
    description: 'Envie apenas nesta atividade o arquivo pratica06.c produzido durante a prática.',
    items: ['Implementei, compilei e testei o programa'],
    accept: '.c,.txt,.zip',
    fieldLabel: 'Arquivo da prática',
  },
  'jupiter-memoria': {
    method: 'checklist',
    description: 'Confira os elementos do mapa mental. Não é necessário enviar arquivo.',
    items: ['Incluí registradores, caches, RAM e armazenamento', 'Indiquei latência, capacidade e custo', 'Registrei o cálculo de AMAT'],
  },
  'jupiter-sprint': {
    method: 'link',
    description: 'Cole o link do quadro ou documento usado pela equipe para registrar a sprint.',
    items: ['O link permite visualizar o backlog preenchido'],
    fieldLabel: 'Link do backlog',
    placeholder: 'https://…',
  },
};

function hasRequiredChecks(requirement: MaterialRequirement, proof: MaterialProof): boolean {
  return Array.isArray(proof.checked) && requirement.items.every(item => proof.checked.includes(item));
}

export function verifyMaterialProof(id: string, proof: unknown): boolean {
  const requirement = MATERIAL_PROOFS[id];
  if (!requirement || !proof || typeof proof !== 'object') return false;
  const candidate = proof as MaterialProof;
  if (candidate.method !== requirement.method || !hasRequiredChecks(requirement, candidate)) return false;

  switch (candidate.method) {
    case 'checklist': return true;
    case 'text': return typeof candidate.text === 'string' && candidate.text.trim().length >= 10 && candidate.text.length <= 300;
    case 'link': {
      if (typeof candidate.url !== 'string' || candidate.url.length > 500) return false;
      try { return ['http:', 'https:'].includes(new URL(candidate.url).protocol); } catch { return false; }
    }
    case 'file': {
      if (typeof candidate.fileName !== 'string' || candidate.fileName.length < 3 || candidate.fileName.length > 200) return false;
      if (!Number.isInteger(candidate.fileSize) || candidate.fileSize <= 0 || candidate.fileSize > 25_000_000) return false;
      const extension = candidate.fileName.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
      return Boolean(extension && requirement.accept?.split(',').includes(extension));
    }
  }
}
