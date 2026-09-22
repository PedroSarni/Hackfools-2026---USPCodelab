import type { AcademyState } from './academy';
import type { ReelAsset } from './contracts';

export type FreddyPhase = 'waiting' | 'active' | 'dying' | 'retired';
export interface FreddySessionState {
  phase: FreddyPhase;
  canDismiss: boolean;
  tasksCompleted: boolean;
  balance: number;
}

export function canDismissFreddy(academy: AcademyState): boolean {
  const missions = academy.missions;
  return missions.length > 0 && missions.every((mission) => Boolean(mission.completedAt));
}

export function sessionReels(reels: ReelAsset[], phase: FreddyPhase): ReelAsset[] {
  if (phase === 'waiting') return reels.slice(0, 2);
  if (phase === 'active') return reels;
  return reels.filter((reel) => !/^reels0[359]\.(mp4|webm)$/i.test(reel.fileName));
}
