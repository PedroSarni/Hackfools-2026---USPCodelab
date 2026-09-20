import { useEffect, useState } from 'react';
import type { AppInfo } from '../../shared/contracts';
import { desktopApps, type DesktopAppDefinition } from './desktop-apps';

function formatClock(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(date).replace('.', '');
}

export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState('');
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    window.baiStudyMain?.getAppInfo().then(setInfo).catch(() => setError('A ponte segura do Electron não respondeu.'));

    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const openApp = async (app: DesktopAppDefinition): Promise<void> => {
    try {
      setError('');
      setLaunchingApp(app.id);

      const bridge = window.baiStudyMain;
      if (!bridge) {
        throw new Error('Ponte segura indisponível');
      }

      await app.launch(bridge);
    } catch {
      setError(`Não foi possível abrir ${app.name}.`);
    } finally {
      setLaunchingApp(null);
    }
  };

  return (
    <main className="desktop-shell">
      <div className="desktop-wallpaper" aria-hidden="true" />

      <header className="desktop-header">
        <div className="desktop-brand" aria-label="BaiStudy OS">
          <span className="desktop-brand__mark">B</span>
          <div>
            <strong>BaiStudy OS</strong>
            <small>Ambiente educacional</small>
          </div>
        </div>
        <div className="desktop-header__status">
          <span aria-hidden="true" />
          Sessão local
        </div>
      </header>

      <section className="desktop-workspace" aria-labelledby="desktop-title">
        <div className="desktop-welcome">
          <p>ÁREA DE TRABALHO</p>
          <h1 id="desktop-title">Olá, vamos focar?</h1>
          <span>Escolha um aplicativo para começar.</span>
        </div>

        <div className="desktop-app-grid" aria-label="Aplicativos instalados">
          {desktopApps.map((app) => (
            <button
              className="desktop-app"
              data-app-id={app.id}
              disabled={launchingApp !== null}
              key={app.id}
              onClick={() => void openApp(app)}
              style={{ '--app-accent': app.accent } as React.CSSProperties}
              title={`${app.description} · ${app.route}`}
              type="button"
            >
              <span className="desktop-app__icon">
                <img src={app.icon} alt="" draggable={false} />
              </span>
              <strong>{app.name}</strong>
              <small>{launchingApp === app.id ? 'Abrindo…' : app.description}</small>
            </button>
          ))}

          <div className="desktop-app desktop-app--future" aria-label="Espaço reservado para novos aplicativos">
            <span className="desktop-app__placeholder" aria-hidden="true">+</span>
            <strong>Novos apps</strong>
            <small>Espaço preparado para o futuro</small>
          </div>
        </div>
      </section>

      {error && <div className="desktop-toast" role="alert">{error}</div>}

      <footer className="desktop-taskbar">
        <div className="desktop-taskbar__system">
          <span className="desktop-brand__mark desktop-brand__mark--small">B</span>
          <span>BaiStudy</span>
        </div>

        <nav className="desktop-dock" aria-label="Atalhos de aplicativos">
          {desktopApps.map((app) => (
            <button
              aria-label={`Abrir ${app.name}`}
              data-dock-app-id={app.id}
              disabled={launchingApp !== null}
              key={app.id}
              onClick={() => void openApp(app)}
              type="button"
            >
              <img src={app.icon} alt="" draggable={false} />
            </button>
          ))}
        </nav>

        <div className="desktop-clock" aria-label={`Agora são ${formatClock(now)}`}>
          <strong>{formatClock(now)}</strong>
          <span>{formatDate(now)}</span>
          {info && <small>v{info.version}</small>}
        </div>
      </footer>
    </main>
  );
}
