import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  balanceOf,
  CATALOG,
  isJupiterManaged,
  MISSION_REWARD,
  STUDY_VIDEO_UPGRADE_PRICES,
  type AcademyAction,
  type AcademyState,
  type Mission,
} from '../../shared/academy';
import type { FredState } from '../../shared/contracts';
import '../styles/academy.css';

type Page = 'Hoje' | 'Missões' | 'Progresso' | 'Aula';

const SHOP_IMAGES: Record<string, string> = {
  lavender: './fred/04_realistic_talking.gif',
  ocean: './fred/01_realistic_scrolling_short_videos.gif',
  brainrot: './fred/01_realistic_scrolling_short_videos.gif',
  premium: './fred/03_realistic_sunglasses.gif',
  screen: './fred/01_realistic_scrolling_short_videos.gif',
  second: './fred/04_realistic_talking.gif',
  fred: './fred/03_realistic_sunglasses.gif',
  break: './fred/realistic_skeleton_transparent_base.png',
};

const COURSE_SHORT: Record<string, string> = {
  'jupiter-scc0502': 'AED I',
  'jupiter-sma0501': 'Cálculo I',
  'jupiter-ssc0503': 'ICC II',
  'jupiter-ssc0513': 'Arq. Comp.',
  'jupiter-ssc0532': 'MDS',
};

function Icon({ name }: { name: 'bolt' | 'coin' | 'book' | 'chart' | 'shop' | 'check' | 'camera' | 'lock' | 'play' }): React.JSX.Element {
  const paths: Record<string, ReactNode> = {
    bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6z" />,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10m3-8.5c-.8-1-4-1.3-4.8.1-1 1.8 4.8 2 3.8 4.8-.8 1.5-4.2 1.2-5 .1" /></>,
    book: <path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3Zm9 2v15" />,
    chart: <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />,
    shop: <><path d="m4 10 2-6h12l2 6" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    camera: <><rect x="3" y="6" width="18" height="14" rx="3" /><circle cx="12" cy="13" r="4" /><path d="m8 6 1-2h6l1 2" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    play: <path d="m9 7 8 5-8 5z" />,
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const prettyDate = (value: string): string => new Date(value).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

export function App(): React.JSX.Element {
  const [state, setState] = useState<AcademyState | null>(null);
  const [fred, setFred] = useState<FredState | null>(null);
  const [page, setPage] = useState<Page>('Hoje');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shopFilter, setShopFilter] = useState('Todos');
  const [selectedShop, setSelectedShop] = useState('lavender');
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const studyVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const bridge = window.baiStudyMain;
    if (!bridge) {
      setError('Abra pelo Electron para ativar Freddy, câmera e dados acadêmicos.');
      return;
    }
    void Promise.all([
      bridge.getAcademy().then(setState),
      bridge.getFredState().then(setFred),

    ]).catch((caught) => setError(String(caught)));
    return bridge.onFredState(setFred);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

  async function dispatch(action: AcademyAction, message: string): Promise<void> {
    if (!window.baiStudyMain || busy) return;
    setBusy(true);
    setError('');
    try {
      setState(await window.baiStudyMain.updateAcademy(action));
      setNotice(message);
      if (action.type === 'mission.complete') await window.baiStudyMain.simulateFred('complete');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : String(caught));
    } finally {
      setBusy(false);
    }
  }

  async function startMission(mission: Mission): Promise<void> {
    if (!window.baiStudyMain) return;
    await window.baiStudyMain.showFred();
    await window.baiStudyMain.simulateFred('study');
    await window.baiStudyMain.openCamera();
    if (mission.id === 'jupiter-pilhas') setPage('Aula');
    else setNotice(`${COURSE_SHORT[mission.subjectId]} ativada. Freddy está fiscalizando.`);
  }

  if (!state) return <main className="bs loading"><span className="loading-bolt"><Icon name="bolt" /></span><h1>Carregando seu semestre…</h1><p>{error || 'Sincronizando JúpiterWeb, Freddy e câmera.'}</p></main>;

  const subjects = state.subjects.filter((subject) => isJupiterManaged(subject.id));
  const missions = state.missions.filter((mission) => isJupiterManaged(mission.id));
  const deadlines = state.deadlines.filter((deadline) => isJupiterManaged(deadline.id));
  const completed = missions.filter((mission) => mission.completedAt).length;
  const percent = Math.round((completed / Math.max(1, missions.length)) * 100);
  const balance = balanceOf(state);
  const selectedItem = CATALOG.find((item) => item.id === selectedShop) ?? CATALOG[0];
  const videoUpgradePrice = STUDY_VIDEO_UPGRADE_PRICES[state.studyVideoLevel];
  const videoWidth = 120 * Math.pow(1.25, state.studyVideoLevel);
  const subjectName = (id: string): string => subjects.find((subject) => subject.id === id)?.name ?? 'Disciplina USP';
  const categories = ['Todos', ...new Set(CATALOG.map((item) => item.category))];
  const filteredCatalog = CATALOG.filter((item) => shopFilter === 'Todos' || item.category === shopFilter);
  const streak = Math.max(7, completed * 3 + 7);

  const missionCard = (mission: Mission, featured = false): React.JSX.Element => {
    const subject = subjects.find((item) => item.id === mission.subjectId);
    return <article className={`forced-mission ${mission.completedAt ? 'is-done' : ''} ${featured ? 'is-featured' : ''}`} key={mission.id}>
      <button className="mission-check" disabled={busy || Boolean(mission.completedAt)} onClick={() => void dispatch({ type: 'mission.complete', id: mission.id }, `Obrigação eliminada. +${MISSION_REWARD} Study Coins.`)} aria-label={`Marcar ${mission.title} como concluída`}>
        {mission.completedAt ? <Icon name="check" /> : <span />}
      </button>
      <div className="mission-main">
        <div className="mission-meta"><span style={{ '--course': subject?.color } as CSSProperties}>{COURSE_SHORT[mission.subjectId]}</span><b><Icon name="lock" /> OBRIGATÓRIA</b></div>
        <h3>{mission.title}</h3>
        <p>{mission.material}{mission.pages && ` · slides/páginas ${mission.pages}`}</p>
        <small>Prazo: {prettyDate(mission.due)} · {new Date(mission.due).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>
      </div>
      {!mission.completedAt && <button className="mission-start" onClick={() => void startMission(mission)}><Icon name="play" /> {mission.id === 'jupiter-pilhas' ? 'Abrir aula' : 'Começar'}</button>}
      {mission.completedAt && <strong className="mission-done-label">FEITO ✓</strong>}
    </article>;
  };

  if (page === 'Aula') {
    return <main className="study-mode">
      <header><button onClick={() => setPage('Hoje')}>← Sair da aula</button><div><b>SCC0502 · PILHAS</b><span>Reels acadêmico obrigatório · Freddy e câmera ativos</span></div><span className="study-live"><i /> AO VIVO</span></header>
      <div className="study-canvas">
        <iframe src="./study/index.html" title="Aula de Pilhas em formato de reels com cassino de minutos" allow="autoplay" />
        <aside className="study-reward-video" style={{ '--video-width': `${videoWidth}px` } as CSSProperties} aria-label="Vídeo de recompensa da aula">
          <div className="study-reward-video__head"><span>SUBWAY SURFERS · 9:16 · {Math.round(videoWidth)} px</span><button type="button" aria-label="Ocultar vídeo" onClick={(event) => { event.stopPropagation(); event.currentTarget.closest('aside')?.classList.toggle('is-minimized'); }}>×</button></div>
          <video ref={studyVideoRef} src="./study/study-reward.mp4" autoPlay loop muted={videoMuted} playsInline preload="auto" onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)} />
          <div className="study-reward-video__actions"><button type="button" onClick={() => { const video = studyVideoRef.current; if (!video) return; if (video.paused) void video.play(); else video.pause(); }}>{videoPlaying ? 'Pausar' : 'Reproduzir'}</button><button type="button" onClick={() => setVideoMuted((muted) => !muted)}>{videoMuted ? 'Ativar som' : 'Silenciar'}</button></div>
          <div className="study-reward-video__upgrade"><span>{videoUpgradePrice ? `Aumente proporcionalmente por ${videoUpgradePrice} Study Coins` : 'Tamanho máximo desbloqueado'}</span><button type="button" disabled={!videoUpgradePrice || balance < videoUpgradePrice || busy} onClick={() => void dispatch({ type: 'study-video.upgrade' }, `Vídeo aumentado para o nível ${state.studyVideoLevel + 1}.`)}>{videoUpgradePrice ? 'Aumentar vídeo' : 'Máximo'}</button></div>
          {videoUpgradePrice && balance < videoUpgradePrice && <small>Faltam {videoUpgradePrice - balance} moedas. Conclua missões para ampliar.</small>}
        </aside>
      </div>
    </main>;
  }

  return <div className={`bs theme-${state.equipped || 'default'}`}>
    <header className="topbar"><div className="topbar-inner">
      <button className="brand" onClick={() => setPage('Hoje')}><span><Icon name="bolt" /></span><b>Foco Total</b><em>ICMC</em></button>
      <nav aria-label="Navegação principal">
        {(['Hoje', 'Missões', 'Progresso'] as Page[]).map((item) => <button key={item} className={page === item ? 'active' : ''} onClick={() => setPage(item)}>{item}</button>)}
      </nav>
      <div className="top-stats"><span><Icon name="coin" /> {balance}</span><button className="bonus-coins" disabled={busy} onClick={() => void dispatch({ type: 'wallet.bonus' }, '+100 Study Coins de demonstração liberadas!')}>+100 COINS</button><span className="streak">🔥 {streak} dias</span><button className="camera-on" onClick={() => void window.baiStudyMain?.openCamera()}><i /> câmera ↗</button></div>
    </div></header>

    {(notice || error) && <div className={`notification ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}><strong>{error ? 'Freddy detectou um problema' : 'MISSÃO ATUALIZADA'}</strong><span>{error || notice}</span><button onClick={() => { setError(''); setNotice(''); }}>×</button></div>}

    {page === 'Hoje' && <main className="content">
      <section className="hero-burst">
        <div><p className="eyebrow">SEGUNDO SEMESTRE · BSI ICMC/USP</p><h1>Você não escolheu estudar.<br/><span>O Júpiter escolheu por você.</span></h1><p>Grade sincronizada. Câmera ligada. Freddy acordado. Agora só falta você fingir que isso foi uma decisão sua.</p><div className="hero-actions"><button className="cta" onClick={() => void startMission(missions[0])}><Icon name="play" /> COMEÇAR PILHAS AGORA</button><button onClick={() => setPage('Missões')}>Ver todas as obrigações</button></div></div>
        <div className="fred-score"><img src="./fred/03_realistic_sunglasses.gif" alt="Freddy usando óculos escuros"/><span>NÍVEL DE COBRANÇA</span><strong>{100 - percent}%</strong><p>{completed ? 'Freddy reconhece um esforço mínimo.' : 'Freddy está profundamente decepcionado.'}</p></div>
      </section>

      <section className="score-strip">
        <div><span>PROGRESSO FORÇADO</span><strong>{percent}%</strong><progress max="100" value={percent}/></div>
        <div><span>OBRIGAÇÕES RESTANTES</span><strong>{missions.length - completed}</strong><small>não podem ser apagadas</small></div>
        <div><span>STUDY COINS</span><strong>{balance}</strong><small>capitalismo acadêmico</small></div>
        <div><span>CÂMERA</span><strong className="online"><i/> ONLINE</strong><small>sim, ela já ligou</small></div>
      </section>

      <div className="home-grid"><section className="mission-stack"><div className="section-title"><div><p className="eyebrow">PRA HOJE, SEM NEGOCIAÇÃO</p><h2>O algoritmo mandou.</h2></div><span>{missions.length - completed} pendentes</span></div>{missions.slice(0, 3).map((mission, index) => missionCard(mission, index === 0))}<button className="see-all" onClick={() => setPage('Missões')}>Ver grade completa →</button></section>
      <aside className="fred-live"><div className="fred-live-head"><span><i/> FREDDY AO VIVO</span><b>{fred?.graphics ?? 'X11'}</b></div><img src={fred?.activity === 'scrolling' ? './fred/01_realistic_scrolling_short_videos.gif' : './fred/realistic_skeleton_transparent_base.png'} alt="Freddy fiscalizando"/><h2>{fred?.visible ? 'Fiscalização ativa' : 'Freddy sumiu. Suspeito.'}</h2><p>“{fred?.message ?? 'Reunindo os ossos…'}”</p><button onClick={() => void window.baiStudyMain?.testFredVoice()}>Freddy, repete isso</button></aside></div>

      <section className="deadline-blast"><div><p className="eyebrow">🚨 SEMANA DE PROVA DETECTADA</p><h2>{deadlines[0]?.title}</h2><p>{deadlines[0]?.content}</p></div><div className="countdown"><span>FALTAM</span><strong>6</strong><b>DIAS</b></div><button onClick={() => setPage('Missões')}>Entrar em modo desespero</button></section>
    </main>}

    {page === 'Missões' && <main className="content">
      <section className="page-heading"><div><p className="eyebrow">IMPORTADO AUTOMATICAMENTE</p><h1>Sua grade não aceita “depois eu vejo”.</h1><p>As disciplinas e obrigações vieram do JúpiterWeb. Freddy bloqueou os botões de excluir por motivos pedagógicos e pessoais.</p></div><span className="jupiter-badge">JÚPITERWEB<br/><b>SINCRONIZADO ✓</b></span></section>
      <section className="course-grid">{subjects.map((subject) => <article key={subject.id} style={{ '--course': subject.color } as CSSProperties}><span><Icon name="book" /></span><div><small>{subject.name.split(' · ')[0]}</small><h3>{subject.name.split(' · ')[1]}</h3><p>{missions.filter((mission) => mission.subjectId === subject.id && !mission.completedAt).length} obrigação pendente</p></div><b><Icon name="lock" /></b></article>)}</section>
      <section className="all-missions"><div className="section-title"><div><p className="eyebrow">FILA DE SOFRIMENTO</p><h2>Missões obrigatórias</h2></div><span>{completed}/{missions.length} eliminadas</span></div>{missions.map((mission) => missionCard(mission))}</section>
      <section className="deadlines-panel"><div className="section-title"><div><p className="eyebrow">PRÓXIMAS AMEAÇAS</p><h2>Provas e entregas</h2></div></div>{deadlines.map((deadline) => <article key={deadline.id}><span>{new Date(deadline.due).getDate()}<small>{new Date(deadline.due).toLocaleDateString('pt-BR', { month: 'short' })}</small></span><div><b>{COURSE_SHORT[deadline.subjectId]}</b><h3>{deadline.title}</h3><p>{deadline.content}</p></div><strong>{deadline.priority === 'high' ? 'PERIGO REAL' : 'AINDA DÁ'}</strong></article>)}</section>
    </main>}

    {page === 'Progresso' && <main className="content">
      <section className="page-heading"><div><p className="eyebrow">DADOS QUE FRED USA CONTRA VOCÊ</p><h1>Seu desempenho acadêmico.</h1><p>Uma visão colorida o bastante para transformar ansiedade em engajamento.</p></div></section>
      <section className="progress-showcase"><div className="mega-ring" style={{ '--progress': `${percent * 3.6}deg` } as CSSProperties}><div><strong>{percent}%</strong><span>SEMESTRE DOMADO</span></div></div><div className="progress-copy"><span>🔥 SEQUÊNCIA ATUAL</span><strong>{streak} dias</strong><p>Recorde pessoal: {streak + 2} dias. Freddy lembra exatamente quando você quebrou.</p><div className="badges"><b>🦴 Fiscalizado</b><b>📚 Semestre 2</b><b>👁 Câmera online</b></div></div><img src="./fred/04_realistic_talking.gif" alt="Freddy comemorando o progresso"/></section>
      <section className="coin-history"><div className="section-title"><div><p className="eyebrow">ECONOMIA PARALELA</p><h2>Extrato de Study Coins</h2></div><strong><Icon name="coin"/> {balance}</strong></div>{state.transactions.length ? [...state.transactions].reverse().map((transaction) => <div key={transaction.id}><span>{transaction.amount > 0 ? '🏆' : '🛒'}</span><p><b>{transaction.reason}</b><small>{new Date(transaction.at).toLocaleString('pt-BR')}</small></p><strong className={transaction.amount > 0 ? 'gain' : ''}>{transaction.amount > 0 ? '+' : ''}{transaction.amount}</strong></div>) : <p className="empty-copy">Nenhuma moeda. Complete uma obrigação e alimente o capitalismo acadêmico.</p>}</section>
    </main>}


    <footer><span>Foco Total · BSI ICMC/USP · 2º período</span><b><i/> Câmera e Freddy fiscalizando em segundo plano</b><button onClick={() => void window.baiStudyMain?.quitApp()}>saída de emergência</button></footer>
  </div>;
}
