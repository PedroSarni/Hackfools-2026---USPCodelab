import { useEffect, useState } from 'react';
import { App } from './App';
import { Fred } from '../fred/Fred';
import { InstagramView } from '../instagram/InstagramView';
import '../styles/instagram.css';
import '../styles/desktop.css';

type WindowName = 'desktop' | 'foco' | 'instagram' | 'skins';
const skins = [['asa','Anjo'],['descolado','Descolado'],['fogo','Em chamas'],['rock','Rockstar'],['bike','Ciclista'],['correndo','Corredor']];

function loadSavedSkin(): string {
  const saved = localStorage.getItem('freddyVideoSkin') || '';
  if (saved === 'freddy_puxando') {
    localStorage.removeItem('freddyVideoSkin');
    return '';
  }
  return saved;
}

export function Desktop(): React.JSX.Element {
  const [active, setActive] = useState<WindowName>('desktop');
  const [started, setStarted] = useState(false);
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
    const shop = (): void => setActive('skins');
    window.addEventListener('freddy:shop', shop);
    const unsub = window.baiStudyMain?.onNavigate((target) => { if (['desktop','foco','instagram','skins'].includes(target)) setActive(target as WindowName); });
    return () => { clearInterval(interval); window.removeEventListener('freddy:shop',shop); unsub?.(); };
  }, []);
  useEffect(() => { if (scene !== 2 || !chrome) return; const timer = setTimeout(() => setScene(3), 2400); return () => clearTimeout(timer); }, [scene,chrome]);
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => { setRunning(false); setStarted(true); setActive('foco'); void window.baiStudyMain?.showFred(); void window.baiStudyMain?.openCamera(); }, 2800);
    return () => clearTimeout(timer);
  }, [running]);
  const closeChrome = (): void => { setChrome(false); setPassword(''); if (!started && !running) setRunning(true); };
  const open = (target: WindowName): void => { if (!started && target === 'foco') { setChrome(true); setScene(0); } else setActive(target); };
  const choose = (id: string): void => { setSkin(id); if (id) localStorage.setItem('freddyVideoSkin',id); else localStorage.removeItem('freddyVideoSkin'); window.dispatchEvent(new Event('freddy:skin')); };
  return <div className="os-desktop">
    <div className="os-icons">
      <button onClick={() => open('foco')}><img src="./desktop/foco-total.png"/><span>Foco Total</span></button>
      <button onClick={() => open('instagram')}><img src="./desktop/instagram.png"/><span>Instagram</span></button>
      <button onClick={() => { setChrome(true); setScene(0); }}><i className="os-edge">e</i><span>Microsoft Edge</span></button>
      <button onClick={() => { setChrome(true); setScene(0); }}><i className="os-chrome-icon"/><span>Google Chrome</span></button>
      <div><i className="os-folder">📁</i><span>Arquivos</span></div>
      <div><i className="os-code">❮❯</i><span>Visual Studio Code</span></div>
      <div><i className="os-folder">🗑</i><span>Lixeira</span></div>
    </div>
    {active !== 'desktop' && <section className={`os-window ${active === 'instagram' ? 'os-window--instagram' : ''} ${maximized ? 'is-maximized' : ''}`}>
      <header className="os-title"><b>{active === 'foco' ? 'Foco Total' : active === 'skins' ? 'FreddyBuddy · Skins' : 'Instagram'}</b><div><button aria-label="Minimizar aplicativo" onClick={() => setActive('desktop')}>—</button><button aria-label="Maximizar aplicativo" onClick={() => setMaximized(!maximized)}>□</button><button aria-label="Fechar aplicativo" onClick={() => setActive('desktop')}>×</button></div></header>
      <div className="os-window-content">
        {active === 'foco' && <App/>}
        {active === 'instagram' && <InstagramView/>}
        {active === 'skins' && <div className="os-skins"><div className="os-skins-heading"><div><small>SEU COMPANHEIRO, SEU ESTILO</small><h1>Guarda-roupa do Freddy</h1><p>Passe o mouse para assistir. Clique para usar a skin.</p></div></div><div className="os-skin-grid"><button className={!skin ? 'selected' : ''} onClick={() => choose('')}><div><img src="./fred/realistic_skeleton_transparent_base.png" alt="Freddy com a skin padrão"/></div><b>Skin padrão</b><span>{!skin ? 'EM USO ✓' : 'Voltar para a padrão'}</span></button>{skins.map(([id,label]) => <button key={id} className={skin === `freddy_${id}` ? 'selected' : ''} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover('')} onFocus={() => setHover(id)} onBlur={() => setHover('')} onClick={() => choose(`freddy_${id}`)}><div>{hover === id ? <video src={`./fred/freddy_${id}.webm`} autoPlay loop muted playsInline/> : <img src={`./fred/skin_${id}.png`} alt={label}/>}</div><b>{label}</b><span>{skin === `freddy_${id}` ? 'EM USO ✓' : 'Usar skin'}</span></button>)}</div></div>}
      </div>
    </section>}
    {chrome && <section className="os-browser"><header><div>◉ &nbsp; {scene === 1 ? 'USP · Login' : 'Google'} <button aria-label="Fechar aba do Chrome" onClick={closeChrome}>×</button></div><button aria-label="Fechar Chrome" onClick={closeChrome}>×</button></header><div className="os-address">← &nbsp; → &nbsp; ↻ <span>{scene === 1 ? 'id.usp.br' : 'accounts.google.com'}</span> ☆</div><div className="os-browser-page">
      {scene === 0 && <form className="os-google" onSubmit={e => { e.preventDefault(); setScene(1); }}><div><b className="google-g">G</b><h1>Sign in</h1><p>to continue to Gmail</p></div><div><input type="email" placeholder="Email or phone" value={email} onChange={e => setEmail(e.target.value)} required/><small>Forgot email?</small><p>Not your computer? Use Guest mode to sign in privately.</p><button>Next</button></div></form>}
      {scene === 1 && <div className="os-usp"><header><b>USP</b><span>Universidade de São Paulo<br/>Brasil</span></header><form onSubmit={e => { e.preventDefault(); setPassword(''); setScene(2); }}><h4>E-MAIL · Universidade de São Paulo</h4><input placeholder="Número USP" aria-label="Número USP" inputMode="numeric" value={usp} onChange={e => setUsp(e.target.value)} required/><input type="password" autoComplete="off" placeholder="Senha" aria-label="Senha" value={password} onChange={e => setPassword(e.target.value)} required/><button>Login</button><p>Simulação local · use dados fictícios</p></form></div>}
      {scene === 2 && <div className="os-download"><span>⚠</span><h1>conta universitária detectada</h1><p>baixando FreddyBuddy...</p><div className="os-spinner"/></div>}
      {scene === 3 && <div className="os-download"><span className="os-success">✓</span><h1>Download concluído</h1><p>FreddyBuddy foi baixado com sucesso!</p><small>Feche o Chrome para começar.</small></div>}
    </div></section>}
    {running && <div className="os-runner"><video src="./fred/freddy_correndo.webm" autoPlay loop muted playsInline/></div>}
    {started && <Fred/>}
    <footer className="os-taskbar"><button aria-label="Mostrar área de trabalho" onClick={() => setActive('desktop')}>⊞</button><button aria-label="Abrir Foco Total" onClick={() => open('foco')}><img src="./desktop/foco-total.png"/></button><button aria-label="Abrir Instagram" onClick={() => open('instagram')}><img src="./desktop/instagram.png"/></button>{started && <><button aria-label="Abrir skins" onClick={() => setActive('skins')}>🦴</button><button aria-label="Restaurar câmera" onClick={() => void window.baiStudyMain?.openCamera()}>📷</button></>}<div className="os-clock">{clock.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}<br/>{clock.toLocaleDateString('pt-BR')}</div></footer>
  </div>;
}
