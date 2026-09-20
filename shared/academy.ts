export interface Subject { id: string; name: string; color: string }
export interface Mission { id: string; title: string; subjectId: string; due: string; criterion: 'manual' | 'minutes' | 'pages'; target: number; material: string; pages: string; completedAt: string | null }
export interface Deadline { id: string; title: string; subjectId: string; due: string; content: string; material: string; pages: string; notes: string; priority: 'normal' | 'high' }
export interface Transaction { id: string; amount: number; reason: string; at: string }
export interface AcademyState { version: 1; subjects: Subject[]; missions: Mission[]; deadlines: Deadline[]; transactions: Transaction[]; owned: string[]; equipped: string | null; studyVideoLevel: number; profile: { name: string; availableMinutes: number } }
export type AcademyAction =
 | { type: 'subject.save'; value: Subject } | { type: 'subject.delete'; id: string }
 | { type: 'mission.save'; value: Mission } | { type: 'mission.delete'; id: string } | { type: 'mission.complete'; id: string }
 | { type: 'deadline.save'; value: Deadline } | { type: 'deadline.delete'; id: string }
 | { type: 'shop.buy'; id: string } | { type: 'shop.equip'; id: string | null }
 | { type: 'study-video.upgrade' }
 | { type: 'wallet.bonus' }
 | { type: 'profile.save'; value: AcademyState['profile'] };
export const MISSION_REWARD = 50;
/** Upgrade prices. Each level increases the displayed width by 25%; CSS keeps 16:9. */
export const STUDY_VIDEO_UPGRADE_PRICES = [50, 100, 200, 400] as const;
export const CATALOG = [
 { id: 'lavender', name: 'Freddy Roxinho da Aprovação', price: 100, color: '#7856c8', category: 'Freddy & Interface', effect: 'Aplica uma skin roxa vibrante na interface do FreddyBuddy.', available: true },
 { id: 'ocean', name: 'Modo Professor Cancelou', price: 150, color: '#087d91', category: 'Freddy & Interface', effect: 'A paz azul-petróleo de descobrir que a aula das 21h foi cancelada.', available: true },
 { id: 'brainrot', name: 'Brainrot a Cada 10 Slides', price: 200, color: '#e85d2a', category: 'Caos controlado', effect: 'Aplica o tema laranja do feed infinito e libera o visual Brainrot.', available: true },
 { id: 'premium', name: 'Freddy Agiota de Óculos', price: 400, color: '#8f43b8', category: 'Freddy & Interface', effect: 'Freddy coloca os óculos e passa a cobrar cada segundo de estudo.', available: true },
 { id: 'screen', name: 'Subway Surfers Acadêmico', price: 350, color: '#d78a00', category: 'Caos controlado', effect: 'Ativa o tema dourado da telinha acadêmica no FreddyBuddy.', available: true },
 { id: 'second', name: 'TDAH Deluxe: Duas Telinhas', price: 500, color: '#d34f65', category: 'Caos controlado', effect: 'Ativa a skin rosa de caos máximo para a interface.', available: true },
 { id: 'fred', name: 'Freddy Influencer de Estudos', price: 400, color: '#563aa4', category: 'Freddy & Interface', effect: 'Freddy vira criador de conteúdo e fiscaliza com confiança absoluta.', available: true },
 { id: 'break', name: 'Intervalo CLT Premium', price: 300, color: '#b26b16', category: 'Caos controlado', effect: 'Ativa o tema marrom-dourado do sindicato dos procrastinadores.', available: true },
] as const;

export const JUPITER_PREFIX = 'jupiter-';
export const isJupiterManaged = (id: string): boolean => id.startsWith(JUPITER_PREFIX);
export const JUPITER_SUBJECTS: Subject[] = [
 { id: 'jupiter-scc0502', name: 'SCC0502 · Algoritmos e Estruturas de Dados I', color: '#f05a34' },
 { id: 'jupiter-sma0501', name: 'SMA0501 · Cálculo I', color: '#5965d8' },
 { id: 'jupiter-ssc0503', name: 'SSC0503 · Introdução à Computação II', color: '#00a38c' },
 { id: 'jupiter-ssc0513', name: 'SSC0513 · Organização e Arquitetura', color: '#d79000' },
 { id: 'jupiter-ssc0532', name: 'SSC0532 · Metodologias de Software', color: '#a449a8' },
];

const localDue = (offsetDays: number, hour: number): string => {
 const date = new Date();
 date.setDate(date.getDate() + offsetDays);
 date.setHours(hour, 0, 0, 0);
 const localOffset = date.getTimezoneOffset() * 60_000;
 return new Date(date.getTime() - localOffset).toISOString().slice(0, 16);
};

export function ensureJupiterSchedule(source: AcademyState): AcademyState {
 const state = structuredClone(source);
 state.studyVideoLevel = Number.isInteger(state.studyVideoLevel) && state.studyVideoLevel >= 0 && state.studyVideoLevel <= STUDY_VIDEO_UPGRADE_PRICES.length ? state.studyVideoLevel : 0;
 for (const subject of JUPITER_SUBJECTS) {
  if (!state.subjects.some(item => item.id === subject.id)) state.subjects.push(subject);
 }
 const missions: Mission[] = [
  { id: 'jupiter-pilhas', title: 'Dominar Pilhas antes que a pilha domine você', subjectId: 'jupiter-scc0502', due: localDue(0, 23), criterion: 'manual', target: 1, material: 'Aula obrigatória em Reels', pages: '1–50', completedAt: null },
  { id: 'jupiter-calculo', title: 'Lista 4 · limites e derivadas sem chorar', subjectId: 'jupiter-sma0501', due: localDue(1, 19), criterion: 'manual', target: 1, material: 'Lista 4 — e-Disciplinas', pages: '1–8', completedAt: null },
  { id: 'jupiter-ponteiros', title: 'Ponteiros, structs e outros eventos canônicos', subjectId: 'jupiter-ssc0503', due: localDue(2, 21), criterion: 'manual', target: 1, material: 'Prática 06', pages: '1–5', completedAt: null },
  { id: 'jupiter-memoria', title: 'Mapa mental da hierarquia de memória', subjectId: 'jupiter-ssc0513', due: localDue(3, 21), criterion: 'manual', target: 1, material: 'Capítulo 5', pages: '112–138', completedAt: null },
  { id: 'jupiter-sprint', title: 'Fechar backlog da sprint sem inventar requisito', subjectId: 'jupiter-ssc0532', due: localDue(4, 23), criterion: 'manual', target: 1, material: 'Projeto do semestre', pages: '', completedAt: null },
 ];
 for (const mission of missions) {
  if (!state.missions.some(item => item.id === mission.id)) state.missions.push(mission);
 }
 const deadlines: Deadline[] = [
  { id: 'jupiter-prova-aed', title: 'P1 · Algoritmos e Estruturas de Dados', subjectId: 'jupiter-scc0502', due: localDue(6, 19), content: 'Pilhas, filas, listas e análise de complexidade', material: 'Slides e listas oficiais', pages: '', notes: 'Freddy decretou semana de prova.', priority: 'high' },
  { id: 'jupiter-entrega-mds', title: 'Entrega da Sprint 2', subjectId: 'jupiter-ssc0532', due: localDue(9, 23), content: 'Backlog, protótipo e retrospectiva', material: 'Repositório do grupo', pages: '', notes: '', priority: 'normal' },
 ];
 for (const deadline of deadlines) {
  if (!state.deadlines.some(item => item.id === deadline.id)) state.deadlines.push(deadline);
 }
 return state;
}

export const initialAcademy = (): AcademyState => ensureJupiterSchedule({ version: 1, subjects: [], missions: [], deadlines: [], transactions: [], owned: [], equipped: null, studyVideoLevel: 0, profile: { name: 'Aluno BSI', availableMinutes: 120 } });
export const balanceOf = (state: AcademyState): number => state.transactions.reduce((sum, t) => sum + t.amount, 0);
function text(value: unknown, max = 500, required = true): asserts value is string {
 if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('Preencha os campos corretamente.');
}
function date(value: unknown): void { text(value, 40); if (!Number.isFinite(Date.parse(value as string))) throw new Error('Data inválida.'); }
function id(value: unknown): asserts value is string { text(value, 100); if (!/^[\w-]+$/.test(value)) throw new Error('Identificador inválido.'); }
export function reduceAcademy(previous: AcademyState, action: AcademyAction, now = new Date().toISOString()): AcademyState {
 if (!action || typeof action !== 'object') throw new Error('Ação inválida.');
 const state = structuredClone(previous);
 const subject = (value: string) => { text(value, 100, false); if (value && !state.subjects.some(s => s.id === value)) throw new Error('Matéria não encontrada.'); };
 switch (action.type) {
 case 'subject.save': {
  const v = action.value; id(v.id); text(v.name, 80); if (!/^#[0-9a-f]{6}$/i.test(v.color)) throw new Error('Cor inválida.');
  if (isJupiterManaged(v.id)) throw new Error('Esta matéria veio do JúpiterWeb e não pode ser alterada.');
  const clean = { id: v.id, name: v.name.trim(), color: v.color }; state.subjects = [...state.subjects.filter(s => s.id !== v.id), clean]; break;
 }
 case 'subject.delete':
  id(action.id); if (isJupiterManaged(action.id)) throw new Error('Matrícula obrigatória importada do JúpiterWeb.'); state.subjects = state.subjects.filter(s => s.id !== action.id); state.missions.forEach(m => { if (m.subjectId === action.id) m.subjectId = ''; }); state.deadlines.forEach(d => { if (d.subjectId === action.id) d.subjectId = ''; }); break;
 case 'mission.save': {
  const v = action.value; id(v.id); text(v.title, 160); subject(v.subjectId); date(v.due); text(v.material, 300, false); text(v.pages, 80, false);
  if (isJupiterManaged(v.id)) throw new Error('Esta missão é obrigatória e veio do JúpiterWeb.');
  if (!['manual', 'minutes', 'pages'].includes(v.criterion) || !Number.isInteger(v.target) || v.target < 1 || v.target > 10000) throw new Error('Critério inválido.');
  if (state.missions.find(m => m.id === v.id)?.completedAt) throw new Error('Missões concluídas não podem ser alteradas.');
  const clean: Mission = { id: v.id, title: v.title.trim(), subjectId: v.subjectId, due: v.due, criterion: v.criterion, target: v.target, material: v.material, pages: v.pages, completedAt: null };
  state.missions = [...state.missions.filter(m => m.id !== v.id), clean]; break;
 }
 case 'mission.delete': id(action.id); if (isJupiterManaged(action.id)) throw new Error('Missão obrigatória: Freddy não deixa apagar.'); state.missions = state.missions.filter(m => m.id !== action.id); break;
 case 'mission.complete': {
  id(action.id); const m = state.missions.find(m => m.id === action.id); if (!m) throw new Error('Missão não encontrada.'); if (m.completedAt) return state;
  if (m.criterion !== 'manual') throw new Error(`Requisito pendente: ${m.target} ${m.criterion === 'minutes' ? 'minutos ativos' : 'páginas visitadas'}. O leitor ainda não está integrado.`);
  m.completedAt = now;
  if (!state.transactions.some(t => t.id === `mission-${m.id}`)) state.transactions.push({ id: `mission-${m.id}`, amount: MISSION_REWARD, reason: `Autodeclaração: ${m.title}`, at: now }); break;
 }
 case 'deadline.save': {
  const v = action.value; id(v.id); text(v.title, 160); subject(v.subjectId); date(v.due); text(v.content, 2000, false); text(v.notes, 2000, false); text(v.material, 300, false); text(v.pages, 80, false);
  if (isJupiterManaged(v.id)) throw new Error('Este prazo veio do JúpiterWeb e não pode ser alterado.');
  if (!['normal', 'high'].includes(v.priority)) throw new Error('Prioridade inválida.');
  state.deadlines = [...state.deadlines.filter(d => d.id !== v.id), { id: v.id, title: v.title, subjectId: v.subjectId, due: v.due, content: v.content, material: v.material, pages: v.pages, notes: v.notes, priority: v.priority }]; break;
 }
 case 'deadline.delete': id(action.id); if (isJupiterManaged(action.id)) throw new Error('Prazo oficial importado do JúpiterWeb.'); state.deadlines = state.deadlines.filter(d => d.id !== action.id); break;
 case 'shop.buy': {
  const item = CATALOG.find(i => i.id === action.id); if (!item?.available) throw new Error('Este item depende de recursos ainda não disponíveis.');
  if (state.owned.includes(item.id)) return state;
  if (balanceOf(state) < item.price) throw new Error('Saldo insuficiente. Conclua missões para ganhar Study Coins.');
  state.transactions.push({ id: `purchase-${item.id}`, amount: -item.price, reason: item.name, at: now }); state.owned.push(item.id); state.equipped = item.id; break;
 }
 case 'shop.equip': if (action.id !== null && !state.owned.includes(action.id)) throw new Error('Resgate o item primeiro.'); state.equipped = action.id; break;
 case 'study-video.upgrade': {
  const nextLevel = state.studyVideoLevel + 1;
  const price = STUDY_VIDEO_UPGRADE_PRICES[state.studyVideoLevel];
  if (price === undefined) throw new Error('O vídeo já está no tamanho máximo.');
  if (balanceOf(state) < price) throw new Error(`Saldo insuficiente. Este aumento custa ${price} Study Coins.`);
  const transactionId = `study-video-upgrade-${nextLevel}`;
  if (state.transactions.some(transaction => transaction.id === transactionId)) { state.studyVideoLevel = nextLevel; break; }
  state.transactions.push({ id: transactionId, amount: -price, reason: `Aumento proporcional do vídeo da aula · nível ${nextLevel}`, at: now });
  state.studyVideoLevel = nextLevel;
  break;
 }
 case 'wallet.bonus': state.transactions.push({ id: `demo-bonus-${now}-${state.transactions.length}`, amount: 100, reason: 'Bônus de demonstração FreddyBuddy', at: now }); break;
 case 'profile.save': text(action.value.name, 80); if (!Number.isInteger(action.value.availableMinutes) || action.value.availableMinutes < 0 || action.value.availableMinutes > 1440) throw new Error('Informe entre 0 e 1440 minutos.'); state.profile = { name: action.value.name.trim(), availableMinutes: action.value.availableMinutes }; break;
 default: throw new Error('Ação desconhecida.');
 }
 return state;
}
