import type { ReelAsset } from '../../shared/contracts';

export interface StudyReelContent {
  id: string;
  title: string;
  topic: string;
  summary: string;
  action: string;
}

export type ReelFeedItem =
  | { id: string; type: 'normal'; asset: ReelAsset }
  | { id: string; type: 'study'; content: StudyReelContent };

export const STUDY_REELS: readonly StudyReelContent[] = [
  {
    id: 'pomodoro',
    topic: 'Gestão do tempo',
    title: 'Um Pomodoro já conta',
    summary: 'Separe 25 minutos para uma única tarefa e deixe todas as notificações de lado.',
    action: 'Escolha agora a tarefa que cabe nesses 25 minutos.',
  },
  {
    id: 'active-recall',
    topic: 'Memorização',
    title: 'Teste sua memória',
    summary: 'Feche o material e tente explicar o assunto usando suas próprias palavras.',
    action: 'Anote três pontos que você consegue lembrar sem consultar.',
  },
  {
    id: 'primeiro-passo',
    topic: 'Volta ao foco',
    title: 'Comece pequeno',
    summary: 'Abrir o material e resolver apenas uma questão reduz a resistência para começar.',
    action: 'Faça uma questão antes de decidir se quer parar.',
  },
];

export function buildReelFeed(
  normalReels: readonly ReelAsset[],
  studyReels: readonly StudyReelContent[] = STUDY_REELS,
): ReelFeedItem[] {
  const feed: ReelFeedItem[] = normalReels.slice(0, 3).map(toNormalItem);
  if (normalReels.length <= 3 || studyReels.length === 0) return feed;

  normalReels.slice(3).forEach((asset, index) => {
    feed.push(toNormalItem(asset));
    const content = studyReels[index % studyReels.length];
    feed.push({ id: `study:${index}:${content.id}`, type: 'study', content });
  });
  return feed;
}

function toNormalItem(asset: ReelAsset): ReelFeedItem {
  return { id: `normal:${asset.id}`, type: 'normal', asset };
}
