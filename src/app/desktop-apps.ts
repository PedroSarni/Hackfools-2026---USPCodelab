import type { MainBridge } from '../../shared/contracts';

export interface DesktopAppDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  launch(bridge: MainBridge): Promise<void>;
  route: string;
  accent: string;
}

/**
 * Catálogo único da área de trabalho. Aplicativos com uma API já exposta pelo
 * preload são adicionados somente com uma nova definição neste array.
 */
export const desktopApps: readonly DesktopAppDefinition[] = [
  {
    id: 'focus',
    name: 'Foco Total',
    description: 'Câmera e sinais locais de atenção',
    icon: './desktop/foco-total.png',
    launch: (bridge) => bridge.openCamera(),
    route: 'camera.html',
    accent: '#3e86ff',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Feed local de Reels',
    icon: './desktop/instagram.png',
    launch: (bridge) => bridge.openInstagram(),
    route: 'instagram.html',
    accent: '#ef3d85',
  },
];
