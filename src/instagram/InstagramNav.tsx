import { InstagramIcon } from './InstagramIcons';

interface InstagramNavProps {
  active: 'home' | 'reels';
  onHome(): void;
  onReels(): void;
}

export function InstagramNav({ active, onHome, onReels }: InstagramNavProps): React.JSX.Element {
  return (
    <nav className="instagram-nav" aria-label="Navegação do Instagram simulado">
      <button type="button" aria-label="Home" aria-current={active === 'home' ? 'page' : undefined} onClick={onHome}>
        <InstagramIcon name="home" filled={active === 'home'} />
      </button>
      <button type="button" aria-label="Reels" aria-current={active === 'reels' ? 'page' : undefined} onClick={onReels}>
        <InstagramIcon name="reels" filled={active === 'reels'} />
      </button>
      <button type="button" aria-label="Criar publicação" tabIndex={-1}><InstagramIcon name="create" /></button>
      <button type="button" aria-label="Busca" tabIndex={-1}><InstagramIcon name="search" /></button>
      <button type="button" aria-label="Perfil" tabIndex={-1} className="instagram-nav__avatar"><InstagramIcon name="profile" /></button>
    </nav>
  );
}
