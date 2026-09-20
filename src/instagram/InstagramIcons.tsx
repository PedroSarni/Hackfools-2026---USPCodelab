type IconName =
  | 'home'
  | 'search'
  | 'create'
  | 'reels'
  | 'profile'
  | 'heart'
  | 'comment'
  | 'share'
  | 'more'
  | 'volume'
  | 'muted';

interface InstagramIconProps {
  name: IconName;
  filled?: boolean;
}

export function InstagramIcon({ name, filled = false }: InstagramIconProps): React.JSX.Element {
  const common = {
    fill: filled ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === 'home' && <><path {...common} d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z" /></>}
      {name === 'search' && <><circle {...common} cx="10.8" cy="10.8" r="6.8" /><path {...common} d="m16 16 5 5" /></>}
      {name === 'create' && <><rect {...common} x="3" y="3" width="18" height="18" rx="5" /><path {...common} d="M12 8v8M8 12h8" /></>}
      {name === 'reels' && <><rect {...common} x="3" y="3" width="18" height="18" rx="5" /><path {...common} d="m3.5 8.5 4-5m2 5 4-5m2 5 4-5M9.5 12.2l5.5 3.3-5.5 3.3z" /></>}
      {name === 'profile' && <><circle {...common} cx="12" cy="8.4" r="3.3" /><path {...common} d="M5.4 20c.8-4 3-6 6.6-6s5.8 2 6.6 6" /></>}
      {name === 'heart' && <path {...common} d="M20.8 4.8c-2-2-5.2-1.8-7 .3L12 7.2l-1.8-2.1c-1.8-2.1-5-2.3-7-.3-2.2 2.2-2 5.7.2 7.8L12 21l8.6-8.4c2.2-2.1 2.4-5.6.2-7.8z" />}
      {name === 'comment' && <><path {...common} d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9 9 0 0 1-3.5-.8L3 21l1.8-5.2A8.5 8.5 0 1 1 21 11.5z" /></>}
      {name === 'share' && <path {...common} d="m22 2-8 20-4.5-8.5L2 9zM9.5 13.5 22 2" />}
      {name === 'more' && <><circle fill="currentColor" cx="5" cy="12" r="1.5" /><circle fill="currentColor" cx="12" cy="12" r="1.5" /><circle fill="currentColor" cx="19" cy="12" r="1.5" /></>}
      {name === 'volume' && <><path {...common} d="M5 10v4h3l4 4V6l-4 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>}
      {name === 'muted' && <><path {...common} d="M5 10v4h3l4 4V6l-4 4zM16 10l5 5M21 10l-5 5" /></>}
    </svg>
  );
}
