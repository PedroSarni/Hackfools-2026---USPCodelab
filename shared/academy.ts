export interface Subject { id: string; name: string; color: string }
export interface Mission { id: string; title: string; subjectId: string; due: string; criterion: 'manual' | 'minutes' | 'pages'; target: number; material: string; pages: string; completedAt: string | null }
export interface Deadline { id: string; title: string; subjectId: string; due: string; content: string; material: string; pages: string; notes: string; priority: 'normal' | 'high' }
export interface Transaction { id: string; amount: number; reason: string; at: string }
export interface AcademyState { version: 1; subjects: Subject[]; missions: Mission[]; deadlines: Deadline[]; transactions: Transaction[]; owned: string[]; equipped: string | null; profile: { name: string; availableMinutes: number } }
export type AcademyAction =
 | { type: 'subject.save'; value: Subject } | { type: 'subject.delete'; id: string }
 | { type: 'mission.save'; value: Mission } | { type: 'mission.delete'; id: string } | { type: 'mission.complete'; id: string }
 | { type: 'deadline.save'; value: Deadline } | { type: 'deadline.delete'; id: string }
 | { type: 'shop.buy'; id: string } | { type: 'shop.equip'; id: string | null }
 | { type: 'profile.save'; value: AcademyState['profile'] };
export const MISSION_REWARD = 50;
export const CATALOG = [
 { id: 'lavender', name: 'Jardim de lavanda', price: 100, color: '#8570c7', category: 'Personalização', effect: 'Aplica tons de lavanda aos botões, destaques e ao fundo.', available: true },
 { id: 'ocean', name: 'Maré de concentração', price: 150, color: '#1b7686', category: 'Personalização', effect: 'Personaliza a interface com uma paleta azul-petróleo.', available: true },
 { id: 'brainrot', name: 'Passe de Brainrot', price: 200, color: '#579987', category: 'Em breve', effect: 'Libera vídeos entre blocos de leitura. Requer leitor e vídeos (etapas 5 e 6).', available: false },
 { id: 'premium', name: 'Brainrot Premium', price: 400, color: '#8270ba', category: 'Em breve', effect: 'Reduz o intervalo entre vídeos. Requer Passe de Brainrot e etapas 5 e 6.', available: false },
 { id: 'screen', name: 'Telinha de Distração', price: 350, color: '#247886', category: 'Em breve', effect: 'Vídeo real ao lado do PDF. Requer leitor e biblioteca de vídeos.', available: false },
 { id: 'second', name: 'Segunda Telinha', price: 500, color: '#d67d76', category: 'Em breve', effect: 'Segunda distração com áudio coordenado. Requer a primeira telinha e vídeos.', available: false },
 { id: 'fred', name: 'Animações alternativas do Fred', price: 400, color: '#8973cb', category: 'Em breve', effect: 'Requer os arquivos de animação e a janela do Fred, ainda ausentes.', available: false },
 { id: 'break', name: 'Intervalo estendido', price: 300, color: '#b58b49', category: 'Em breve', effect: 'Adiciona 5 minutos ao descanso. Requer o sistema de descanso da etapa 9.', available: false },
] as const;
export const initialAcademy = (): AcademyState => ({ version: 1, subjects: [], missions: [], deadlines: [], transactions: [], owned: [], equipped: null, profile: { name: 'Estudante', availableMinutes: 120 } });
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
  const clean = { id: v.id, name: v.name.trim(), color: v.color }; state.subjects = [...state.subjects.filter(s => s.id !== v.id), clean]; break;
 }
 case 'subject.delete':
  id(action.id); state.subjects = state.subjects.filter(s => s.id !== action.id); state.missions.forEach(m => { if (m.subjectId === action.id) m.subjectId = ''; }); state.deadlines.forEach(d => { if (d.subjectId === action.id) d.subjectId = ''; }); break;
 case 'mission.save': {
  const v = action.value; id(v.id); text(v.title, 160); subject(v.subjectId); date(v.due); text(v.material, 300, false); text(v.pages, 80, false);
  if (!['manual', 'minutes', 'pages'].includes(v.criterion) || !Number.isInteger(v.target) || v.target < 1 || v.target > 10000) throw new Error('Critério inválido.');
  if (state.missions.find(m => m.id === v.id)?.completedAt) throw new Error('Missões concluídas não podem ser alteradas.');
  const clean: Mission = { id: v.id, title: v.title.trim(), subjectId: v.subjectId, due: v.due, criterion: v.criterion, target: v.target, material: v.material, pages: v.pages, completedAt: null };
  state.missions = [...state.missions.filter(m => m.id !== v.id), clean]; break;
 }
 case 'mission.delete': id(action.id); state.missions = state.missions.filter(m => m.id !== action.id); break;
 case 'mission.complete': {
  id(action.id); const m = state.missions.find(m => m.id === action.id); if (!m) throw new Error('Missão não encontrada.'); if (m.completedAt) return state;
  if (m.criterion !== 'manual') throw new Error(`Requisito pendente: ${m.target} ${m.criterion === 'minutes' ? 'minutos ativos' : 'páginas visitadas'}. O leitor ainda não está integrado.`);
  m.completedAt = now;
  if (!state.transactions.some(t => t.id === `mission-${m.id}`)) state.transactions.push({ id: `mission-${m.id}`, amount: MISSION_REWARD, reason: `Autodeclaração: ${m.title}`, at: now }); break;
 }
 case 'deadline.save': {
  const v = action.value; id(v.id); text(v.title, 160); subject(v.subjectId); date(v.due); text(v.content, 2000, false); text(v.notes, 2000, false); text(v.material, 300, false); text(v.pages, 80, false);
  if (!['normal', 'high'].includes(v.priority)) throw new Error('Prioridade inválida.');
  state.deadlines = [...state.deadlines.filter(d => d.id !== v.id), { id: v.id, title: v.title, subjectId: v.subjectId, due: v.due, content: v.content, material: v.material, pages: v.pages, notes: v.notes, priority: v.priority }]; break;
 }
 case 'deadline.delete': id(action.id); state.deadlines = state.deadlines.filter(d => d.id !== action.id); break;
 case 'shop.buy': {
  const item = CATALOG.find(i => i.id === action.id); if (!item?.available) throw new Error('Este item depende de recursos ainda não disponíveis.');
  if (state.owned.includes(item.id)) return state;
  if (balanceOf(state) < item.price) throw new Error('Saldo insuficiente. Conclua missões para ganhar Study Coins.');
  state.transactions.push({ id: `purchase-${item.id}`, amount: -item.price, reason: item.name, at: now }); state.owned.push(item.id); break;
 }
 case 'shop.equip': if (action.id !== null && !state.owned.includes(action.id)) throw new Error('Resgate o item primeiro.'); state.equipped = action.id; break;
 case 'profile.save': text(action.value.name, 80); if (!Number.isInteger(action.value.availableMinutes) || action.value.availableMinutes < 0 || action.value.availableMinutes > 1440) throw new Error('Informe entre 0 e 1440 minutos.'); state.profile = { name: action.value.name.trim(), availableMinutes: action.value.availableMinutes }; break;
 default: throw new Error('Ação desconhecida.');
 }
 return state;
}
