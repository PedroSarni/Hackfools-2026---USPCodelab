import { useEffect, useState } from 'react';
import { App } from './App';
import { FREDDY_DISMISS_PRICE, FREDDY_SKINS, type AcademyState } from '../../shared/academy';
import type { FreddySessionState } from '../../shared/freddy-session';
import { FreddyFarewell } from '../fred/FreddyFarewell';
import { MatteVideo } from '../fred/MatteVideo';
import { Fred } from '../fred/Fred';
import { InstagramView } from '../instagram/InstagramView';
import '../styles/instagram.css';
import '../styles/desktop.css';

type WindowName = 'desktop' | 'foco' | 'instagram';
const skins = FREDDY_SKINS.map(item => [item.id.replace('freddy_', ''), item.name] as const);

function loadSavedSkin(): string {
  const saved = localStorage.getItem('freddyVideoSkin') || '';
  if (!FREDDY_SKINS.some(item => saved === item.id)) {
    localStorage.removeItem('freddyVideoSkin');
    return '';
  }
  return saved;
}

export function Desktop(): React.JSX.Element {
  const [active, setActive] = useState<WindowName>('desktop');
  const [session, setSession] = useState<FreddySessionState>({ phase: 'waiting', canDismiss: false, tasksCompleted: false, balance: 0 });
  const started = session.phase === 'active';
  const [shopOpen, setShopOpen] = useState(false);
  const [shopAcademy, setShopAcademy] = useState<AcademyState | null>(null);
  const [buyingSkin, setBuyingSkin] = useState('');
  const [error, setError] = useState('');
  const [dismissing, setDismissing] = useState(false);
  const applySkin = (id: string): void => { setSkin(id); if (id) localStorage.setItem('freddyVideoSkin', id); else localStorage.removeItem('freddyVideoSkin'); window.dispatchEvent(new Event('freddy:skin')); };
  const refreshStore = (): void => {
    const bridge = window.baiStudyMain;
    if (!bridge) return;
    void Promise.all([bridge.getSession(), bridge.getAcademy()]).then(([nextSession, academy]) => {
      setSession(nextSession);
      setShopAcademy(academy);
      const saved = loadSavedSkin();
      const equippedSkin = FREDDY_SKINS.some(item => item.id === academy.equipped) ? academy.equipped ?? '' : '';
      const allowedSkin = equippedSkin || (saved && academy.owned.includes(saved) ? saved : '');
      if (allowedSkin !== skin) applySkin(allowedSkin);
    }).catch((error) => setError(String(error)));
  };
  const openShop = (): void => { refreshStore(); setShopOpen(true); };
  const dismiss = async (): Promise<void> => {
    if (dismissing) return;
    setDismissing(true);
    try {
      const next = await window.baiStudyMain?.dismissBuddy();
      if (!next) throw new Error('Abra pelo Electron.');
      setSession(next); setShopOpen(false); setActive('desktop');
    } catch (error) { setError(String(error)); } finally { setDismissing(false); }
  };
  const finish = async (): Promise<void> => {
    try { const next = await window.baiStudyMain?.finishBuddy(); if (next) setSession(next); }
    catch (error) { setError(String(error)); }
  };
  const [running, setRunning] = useState(false);
  const [chrome, setChrome] = useState(false);
  const [scene, setScene] = useState(0);
  const [email, setEmail] = useState('');
  const [usp, setUsp] = useState('');
  const [password, setPassword] = useState('');
  const [clock, setClock] = useState(new Date());
  const [skin, setSkin] = useState(loadSavedSkin);
  const [hover, setHover] = useState('');
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    refreshStore();
    const shop = openShop;
    window.addEventListener('freddy:shop', shop);
    const unsub = window.baiStudyMain?.onNavigate((target) => { if (['desktop','foco','instagram'].includes(target)) setActive(target as WindowName); });
    return () => { clearInterval(interval); window.removeEventListener('freddy:shop',shop); unsub?.(); };
  }, []);
  useEffect(() => {
    if (!shopOpen) return;
    const close = (event: KeyboardEvent): void => { if (event.key === 'Escape') { event.stopImmediatePropagation(); setShopOpen(false); } };
    window.addEventListener('keydown', close, true);
    return () => window.removeEventListener('keydown', close, true);
  }, [shopOpen]);
  useEffect(() => { if (scene !== 2 || !chrome) return; const timer = setTimeout(() => setScene(3), 2400); return () => clearTimeout(timer); }, [scene,chrome]);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const next = await window.baiStudyMain?.startBuddy();
          if (!next) throw new Error('Abra pelo Electron para iniciar o Foco Total.');
          setSession(next); setActive('foco');
          await window.baiStudyMain?.openCamera();
        } catch (error) { setError(String(error)); } finally { setRunning(false); }
      })();
    }, 2800);
    return () => clearTimeout(timer);
  }, [running]);
  const closeChrome = (): void => { setChrome(false); setPassword(''); if (session.phase === 'waiting' && !running && scene === 3) setRunning(true); };
  const open = (target: WindowName): void => { if (target !== 'foco' || started) setActive(target); };
  const choose = async (id: string): Promise<void> => {
    const bridge = window.baiStudyMain;
    if (!bridge || buyingSkin) return;
    setBuyingSkin(id || 'default');
    setError('');
    try {
      let academy = shopAcademy ?? await bridge.getAcademy();
      if (!id) academy = await bridge.updateAcademy({ type: 'shop.equip', id: null });
      else if (academy.owned.includes(id)) academy = await bridge.updateAcademy({ type: 'shop.equip', id });
      else academy = await bridge.updateAcademy({ type: 'shop.buy', id });
      setShopAcademy(academy);
      applySkin(id);
      setSession(await bridge.getSession());
      await bridge.skinSelected(id);
    } catch (error) { setError(error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : String(error)); }
    finally { setBuyingSkin(''); }
  };
  const skinStatus = (shortId: string): string => {
    const id = `freddy_${shortId}`;
    if (buyingSkin === id) return 'PROCESSANDO…';
    if (skin === id) return 'EM USO ✓';
    if (shopAcademy?.owned.includes(id)) return 'Usar skin';
    const item = FREDDY_SKINS.find(candidate => candidate.id === id);
    return `Comprar · ${item?.price ?? 0} Study Coins`;
  };
  return <div className="os-desktop">
    <div className="os-icons">
      {started && <button onClick={() => open('foco')}><img src="./desktop/foco-total.png"/><span>Foco Total</span></button>}
      <button onClick={() => open('instagram')}><img src="./desktop/instagram.png"/><span>Instagram</span></button>
      <button onClick={() => { setChrome(true); setScene(0); }}><i className="os-chrome-icon"/><span>Google Chrome</span></button>
      <div><i className="os-folder">📁</i><span>Arquivos</span></div>
      <div><i className="os-code">❮❯</i><span>Visual Studio Code</span></div>
      <div><i className="os-folder">🗑</i><span>Lixeira</span></div>
    </div>
    {active !== 'desktop' && (active !== 'foco' || started) && <section className={`os-window ${active === 'instagram' ? 'os-window--instagram' : ''} ${maximized ? 'is-maximized' : ''}`}>
      <header className="os-title"><b>{active === 'foco' ? 'Foco Total' : 'Instagram'}</b><div><button aria-label="Minimizar aplicativo" onClick={() => setActive('desktop')}>—</button><button aria-label="Maximizar aplicativo" onClick={() => setMaximized(!maximized)}>□</button><button aria-label="Fechar aplicativo" onClick={() => setActive('desktop')}>×</button></div></header>
      <div className="os-window-content">
        {active === 'foco' && <App/>}
        {active === 'instagram' && <InstagramView key={session.phase} phase={session.phase}/>}

      </div>
    </section>}
    {chrome && <section className="os-browser"><header><div>◉ &nbsp; {scene === 1 ? 'USP · Login' : 'Google'} <button aria-label="Fechar aba do Chrome" onClick={closeChrome}>×</button></div><button aria-label="Fechar Chrome" onClick={closeChrome}>×</button></header><div className="os-address">← &nbsp; → &nbsp; ↻ <span>{scene === 1 ? 'id.usp.br' : 'accounts.google.com'}</span> ☆</div><div className="os-browser-page">
      {scene === 0 && <form className="os-google" onSubmit={e => { e.preventDefault(); if (!/^[^\s@]+@usp\.br$/i.test(email.trim())) { setError('Use um e-mail @usp.br.'); return; } setError(''); setScene(1); }}><div><b className="google-g">G</b><h1>Sign in</h1><p>to continue to Gmail</p></div><div><input type="email" aria-label="E-mail USP" placeholder="aluno@usp.br" value={email} onChange={e => setEmail(e.target.value)} required/><small>Forgot email?</small><p>Not your computer? Use Guest mode to sign in privately.</p><button>Next</button></div></form>}
      {scene === 1 && <div className="os-usp"><header><b>USP</b><span>Universidade de São Paulo<br/>Brasil</span></header><form onSubmit={e => { e.preventDefault(); if (!/^\d+$/.test(usp) || !password) { setError('Informe um número USP válido e a senha fictícia.'); return; } setError(''); setPassword(''); setScene(2); }}><h4>E-MAIL · Universidade de São Paulo</h4><input placeholder="Número USP" aria-label="Número USP" inputMode="numeric" pattern="[0-9]+" value={usp} onChange={e => setUsp(e.target.value.replace(/\D/g, ''))} required/><input type="password" autoComplete="off" placeholder="Senha" aria-label="Senha" value={password} onChange={e => setPassword(e.target.value)} required/><button>Login</button><p>Simulação local · use dados fictícios</p></form></div>}
      {scene === 2 && <div className="os-download"><span>⚠</span><h1>conta universitária detectada</h1><p>baixando Foco Total...</p><div className="os-spinner"/></div>}
      {scene === 3 && <div className="os-download"><span className="os-success">✓</span><h1>Download concluído</h1><p>Foco Total foi baixado com sucesso!</p><small>Feche o Chrome para começar.</small></div>}
    </div></section>}
    {started && shopOpen && <div className="os-modal-backdrop" onClick={() => setShopOpen(false)}><section className="os-shop-dialog" role="dialog" aria-modal="true" aria-label="Loja do Freddy" onClick={event => event.stopPropagation()}><button className="os-shop-close" autoFocus aria-label="Fechar loja" onClick={() => setShopOpen(false)}>&times;</button> <div className="os-skins"><div className="os-skins-heading"><div><small>SEU COMPANHEIRO, SEU ESTILO</small><h1>Guarda-roupa do Freddy</h1><p>Passe o mouse para assistir. Compre ou equipe uma skin. Saldo: {session.balance} Study Coins.</p></div></div><div className="os-skin-grid"><button className={!skin ? 'selected' : ''} onClick={() => choose('')}><div><img src="./fred/realistic_skeleton_transparent_base.png" alt="Freddy com a skin padrão"/></div><b>Skin padrão</b><span>{!skin ? 'EM USO ✓' : 'Voltar para a padrão'}</span></button>{skins.map(([id,label]) => <button key={id} className={skin === `freddy_${id}` ? 'selected' : ''} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover('')} onFocus={() => setHover(id)} onBlur={() => setHover('')} onClick={() => choose(`freddy_${id}`)}><div>{id === 'bike' ? <MatteVideo src="./fred/freddy_bike.webm" sideInset={0.14} loop label="Freddy ciclista" /> : hover === id ? <video src={`./fred/freddy_${id}.webm`} autoPlay loop muted playsInline/> : <img src={`./fred/skin_${id}.png`} alt={label}/>}</div><b>{label}</b><span>{skin === `freddy_${id}` ? 'EM USO ✓' : skinStatus(id)}</span></button>)}</div></div><div className="os-farewell-unlock"><p>{session.tasksCompleted ? 'Todas as tarefas concluídas. Sua liberdade está desbloqueada sem custo.' : `Conclua todas as tarefas ou pague ${FREDDY_DISMISS_PRICE} moedas. Saldo atual: ${session.balance}.`}</p><button disabled={!session.canDismiss || dismissing} onClick={() => void dismiss()}>{dismissing ? 'Preparando...' : session.tasksCompleted ? 'Matar o Freddy' : `Matar o Freddy · ${FREDDY_DISMISS_PRICE} moedas`}</button></div></section></div>}
    {error && <div className="os-error" role="alert">{error}<button onClick={() => setError('')}>&times;</button></div>}
    {session.phase === 'dying' && <FreddyFarewell onFinished={() => void finish()}/>}
    {running && <div className="os-runner"><video src="./fred/freddy_correndo.webm" autoPlay loop muted playsInline/></div>}
    {started && <Fred/>}
    <footer className="os-taskbar"><button aria-label="Mostrar área de trabalho" onClick={() => setActive('desktop')}>⊞</button>{started && <button aria-label="Abrir Foco Total" onClick={() => open('foco')}><img src="./desktop/foco-total.png"/></button>}<button aria-label="Abrir Instagram" onClick={() => open('instagram')}><img src="./desktop/instagram.png"/></button>{started && <><button aria-label="Abrir skins" onClick={openShop}>🦴</button><button aria-label="Restaurar câmera" onClick={() => void window.baiStudyMain?.openCamera()}>📷</button></>}<div className="os-clock">{clock.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}<br/>{clock.toLocaleDateString('pt-BR')}</div></footer>
  </div>;
}
