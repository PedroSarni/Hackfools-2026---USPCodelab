import { useEffect, useState } from 'react';
import type { ProcrastinationSessionState, ReelAsset } from '../../shared/contracts';
import { InstagramNav } from './InstagramNav';
import { ReelsFeed } from './ReelsFeed';
import type { FreddyPhase } from '../../shared/freddy-session';

export function InstagramView({ phase }: { phase: FreddyPhase }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'home' | 'reels'>('home');
  const [reels, setReels] = useState<ReelAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procrastinationState, setProcrastinationState] = useState<ProcrastinationSessionState>({
    warningShown: false,
    limitReached: false,
  });

  useEffect(() => {
    const bridge = window.baiStudyInstagram;
    if (!bridge) {
      setError('A ponte segura do Instagram não está disponível.');
      setLoading(false);
      return;
    }

    Promise.all([bridge.getReels(), bridge.getProcrastinationState()])
      .then(([assets, sessionState]) => {
        console.info(`[Reels/UI] lista recebida via IPC ${JSON.stringify({
          count: assets.length,
          assets: assets.map((asset, index) => ({ index, ...asset })),
          procrastinationState: sessionState,
        })}`);
        setReels(assets);
        setProcrastinationState(sessionState);
      })
      .catch((loadError: unknown) => {
        const details = loadError instanceof Error ? `${loadError.name}: ${loadError.message}` : String(loadError);
        console.error(`[Reels/UI] falha ao consultar lista via IPC ${JSON.stringify({ error: details })}`);
        setError(`Não foi possível consultar a pasta local de vídeos. ${details}`);
      })
      .finally(() => setLoading(false));

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') void window.baiStudyInstagram?.closeWindow();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <main className="instagram-shell">
      <div className="instagram-drag-handle" aria-hidden="true" />
      <button
        className="instagram-desktop-button"
        type="button"
        aria-label="Voltar ao Desktop"
        onClick={() => void window.baiStudyInstagram?.closeWindow()}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M3 10.8 12 3l9 7.8v9.4a.8.8 0 0 1-.8.8h-5.4v-6.2H9.2V21H3.8a.8.8 0 0 1-.8-.8Z" />
        </svg>
        <span>Desktop</span>
      </button>
      <button className="instagram-close" type="button" aria-label="Fechar Instagram" onClick={() => void window.baiStudyInstagram?.closeWindow()}>×</button>
      <section className="instagram-content">
        {activeTab === 'home' ? (
          <div className="instagram-home" aria-label="Home estática do Instagram simulado">
            <img src="./instagram/home.png" alt="Home estática do Instagram com stories e publicação do Hackfools" draggable={false} />
            <InstagramNav active={activeTab} onHome={() => setActiveTab('home')} onReels={() => setActiveTab('reels')} />
          </div>
        ) : (
          <ReelsFeed
            supervised={phase === 'active'}
            reels={reels}
            loading={loading}
            error={error}
            initialSessionState={procrastinationState}
          />
        )}
      </section>
      {activeTab === 'reels' && <InstagramNav active={activeTab} onHome={() => setActiveTab('home')} onReels={() => setActiveTab('reels')} />}
    </main>
  );
}
