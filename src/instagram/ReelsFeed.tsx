import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProcrastinationMilestone, ProcrastinationSessionState, ReelAsset } from '../../shared/contracts';
import { InstagramIcon } from './InstagramIcons';
import { buildReelFeed, type ReelFeedItem, type StudyReelContent } from './reel-feed';

const WARNING_POSITION = 3;
const LIMIT_POSITION = 9;

type ProcrastinationModal = 'warning' | 'limit' | null;

interface ReelsFeedProps {
  reels: ReelAsset[];
  loading: boolean;
  error: string;
  initialSessionState: ProcrastinationSessionState;
}

export function ReelsFeed({ reels, loading, error, initialSessionState }: ReelsFeedProps): React.JSX.Element {
  const feedItems = useMemo(() => buildReelFeed(reels), [reels]);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());
  const [failed, setFailed] = useState<Map<string, string>>(() => new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const navigationTargetRef = useRef<number | null>(null);
  const [muted, setMuted] = useState(true);
  const [modal, setModal] = useState<ProcrastinationModal>(() =>
    initialSessionState.limitReached ? 'limit' : null,
  );
  const warningTriggeredRef = useRef(initialSessionState.warningShown);
  const limitTriggeredRef = useRef(initialSessionState.limitReached);
  const [openingStudy, setOpeningStudy] = useState(false);
  const [redirectError, setRedirectError] = useState('');
  const dragStartY = useRef<number | null>(null);
  const dragStartScrollTop = useRef(0);
  const dragStartIndex = useRef(0);
  const activeItem = feedItems[activeIndex] ?? null;
  const activeId = activeItem?.id ?? null;
  const interactionBlocked = modal !== null;

  const goToIndex = useCallback((requestedIndex: number, behavior: ScrollBehavior = 'smooth'): void => {
    const root = containerRef.current;
    if (!root || feedItems.length === 0 || interactionBlocked) return;
    const lastAllowedIndex = Math.min(feedItems.length - 1, LIMIT_POSITION - 1);
    const nextIndex = Math.min(lastAllowedIndex, Math.max(0, requestedIndex));
    const target = root.querySelectorAll<HTMLElement>('[data-reel-id]')[nextIndex];
    if (!target) return;

    navigationTargetRef.current = nextIndex;
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    root.scrollTo({ top: target.offsetTop, behavior });
  }, [feedItems.length, interactionBlocked]);

  const goToReel = useCallback((direction: -1 | 1): void => {
    goToIndex(activeIndexRef.current + direction);
  }, [goToIndex]);

  useEffect(() => {
    if (initialSessionState.warningShown) warningTriggeredRef.current = true;
    if (initialSessionState.limitReached) {
      limitTriggeredRef.current = true;
      setModal('limit');
    }
  }, [initialSessionState.limitReached, initialSessionState.warningShown]);

  useEffect(() => {
    if (activeIndex < feedItems.length) return;
    activeIndexRef.current = Math.max(0, feedItems.length - 1);
    setActiveIndex(activeIndexRef.current);
  }, [activeIndex, feedItems.length]);

  useEffect(() => {
    if (!activeItem) return;
    const position = activeIndex + 1;
    logReel('info', '[Reels/anti-procrastination] Reel atual', {
      position,
      index: activeIndex,
      id: activeItem.id,
      type: activeItem.type,
    });

    if (position >= LIMIT_POSITION) {
      if (!limitTriggeredRef.current) {
        limitTriggeredRef.current = true;
        warningTriggeredRef.current = true;
        logReel('info', '[Reels/anti-procrastination] modal do Reel 9 acionado', {
          position,
          id: activeItem.id,
          type: activeItem.type,
        });
        void recordMilestone('limit');
      }
      setModal('limit');
      return;
    }

    if (position >= WARNING_POSITION && !warningTriggeredRef.current) {
      warningTriggeredRef.current = true;
      logReel('info', '[Reels/anti-procrastination] modal do Reel 3 acionado', {
        position,
        id: activeItem.id,
        type: activeItem.type,
      });
      void recordMilestone('warning');
      setModal('warning');
    }
  }, [activeIndex, activeItem]);

  useEffect(() => {
    const syncPlayback = (): void => {
      const canPlay = document.visibilityState === 'visible' && document.hasFocus() && !interactionBlocked;
      for (const [id, video] of videoRefs.current) {
        const isActive = id === activeId && canPlay;
        video.muted = !isActive || muted;
        if (isActive) {
          void video.play().catch((playError: unknown) => {
            const interrupted = playError instanceof DOMException && playError.name === 'AbortError';
            logReel(interrupted ? 'info' : 'error', interrupted
              ? '[Reels/video] play() interrompido durante troca de Reel'
              : '[Reels/video] play() rejeitado', {
              reelId: id,
              currentSrc: video.currentSrc,
              error: describeUnknownError(playError),
              media: describeVideoState(video),
            });
          });
        } else {
          video.pause();
        }
      }
    };
    syncPlayback();
    window.addEventListener('focus', syncPlayback);
    window.addEventListener('blur', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      window.removeEventListener('focus', syncPlayback);
      window.removeEventListener('blur', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      for (const video of videoRefs.current.values()) video.pause();
    };
  }, [activeId, interactionBlocked, muted]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      if (!interactionBlocked) goToReel(event.key === 'ArrowDown' ? 1 : -1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToReel, interactionBlocked]);

  const startStudying = async (): Promise<void> => {
    if (openingStudy) return;
    setOpeningStudy(true);
    setRedirectError('');
    logReel('info', '[Reels/anti-procrastination] abertura do link do YouTube solicitada', {
      position: activeIndexRef.current + 1,
    });
    try {
      const bridge = window.baiStudyInstagram;
      if (!bridge) throw new Error('Ponte segura do Instagram indisponível.');
      await bridge.startStudying();
    } catch (openError) {
      const details = describeUnknownError(openError);
      logReel('error', '[Reels/anti-procrastination] redirecionamento falhou', { error: details });
      setRedirectError(`Não foi possível abrir o navegador. ${details}`);
      setOpeningStudy(false);
    }
  };

  if (loading) return <FeedMessage title="Carregando Reels…" detail="Procurando vídeos locais." />;
  if (error) return <FeedMessage title="Reels indisponíveis" detail={error} />;
  if (reels.length === 0) {
    return <FeedMessage title="Nenhum Reel por aqui" detail="Adicione arquivos .mp4 ou .webm em assets/reels e reabra esta janela." />;
  }

  return (
    <div className="reels-stage">
      <div
        className={`reels-feed${interactionBlocked ? ' reels-feed--paused' : ''}`}
        ref={containerRef}
        onScroll={(event) => {
          const root = event.currentTarget;
          if (root.clientHeight === 0 || interactionBlocked) return;
          const navigationTarget = navigationTargetRef.current;
          if (navigationTarget !== null) {
            const target = root.querySelectorAll<HTMLElement>('[data-reel-id]')[navigationTarget];
            if (target && Math.abs(root.scrollTop - target.offsetTop) <= 2) {
              navigationTargetRef.current = null;
            }
            return;
          }
          const visibleIndex = Math.round(root.scrollTop / root.clientHeight);
          const index = Math.min(feedItems.length - 1, LIMIT_POSITION - 1, Math.max(0, visibleIndex));
          if (index !== activeIndexRef.current) {
            activeIndexRef.current = index;
            setActiveIndex(index);
          }
        }}
        onPointerDown={(event) => {
          if (interactionBlocked) return;
          if (event.pointerType === 'mouse' && (event.target as HTMLElement).closest('button')) return;
          navigationTargetRef.current = null;
          dragStartY.current = event.clientY;
          dragStartScrollTop.current = event.currentTarget.scrollTop;
          dragStartIndex.current = activeIndexRef.current;
          if (event.pointerType === 'mouse') event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onWheel={() => { navigationTargetRef.current = null; }}
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse' || dragStartY.current === null || interactionBlocked) return;
          event.preventDefault();
          event.currentTarget.scrollTop = dragStartScrollTop.current + dragStartY.current - event.clientY;
        }}
        onPointerUp={(event) => {
          const startY = dragStartY.current;
          dragStartY.current = null;
          if (startY === null || interactionBlocked) return;
          const distance = event.clientY - startY;
          const direction = Math.abs(distance) >= 45 ? (distance < 0 ? 1 : -1) : 0;
          goToIndex(dragStartIndex.current + direction);
        }}
        onPointerCancel={() => { dragStartY.current = null; }}
      >
        <header className="reels-header"><strong>Reels</strong><InstagramIcon name="create" /></header>
        {feedItems.map((item, index) => (
          <article
            className={`reel${item.type === 'study' ? ' reel--study' : ''}`}
            data-reel-id={item.id}
            data-reel-type={item.type}
            key={item.id}
          >
            {item.type === 'normal' ? renderNormalReel({
              item,
              index,
              activeIndex,
              activeId,
              muted,
              failed,
              videoRefs,
              setFailed,
              setMuted,
            }) : (
              <StudyReel content={item.content} position={index + 1} />
            )}
          </article>
        ))}
      </div>

      {modal === 'warning' && (
        <ProcrastinationDialog
          eyebrow="Pausa consciente"
          title="Seu tempo de procrastinação está ficando alto."
          message="A partir de agora vamos intercalar conteúdos de estudo com os reels normais para ajudar você a voltar ao foco."
          actionLabel="Continuar"
          onAction={() => setModal(null)}
        />
      )}

      {modal === 'limit' && (
        <ProcrastinationDialog
          eyebrow="Limite alcançado"
          title="Seu tempo de reels acabou."
          message="Agora é hora de voltar aos estudos. Vamos abrir uma playlist para você começar imediatamente."
          actionLabel={openingStudy ? 'Abrindo…' : 'Começar a estudar'}
          onAction={() => void startStudying()}
          disabled={openingStudy}
          error={redirectError}
        />
      )}
    </div>
  );
}

interface NormalReelRenderProps {
  item: Extract<ReelFeedItem, { type: 'normal' }>;
  index: number;
  activeIndex: number;
  activeId: string | null;
  muted: boolean;
  failed: Map<string, string>;
  videoRefs: React.RefObject<Map<string, HTMLVideoElement>>;
  setFailed: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

function renderNormalReel({
  item,
  index,
  activeIndex,
  activeId,
  muted,
  failed,
  videoRefs,
  setFailed,
  setMuted,
}: NormalReelRenderProps): React.JSX.Element {
  const reel = item.asset;
  return (
    <>
      <video
        ref={(element) => {
          if (element) videoRefs.current.set(item.id, element);
          else videoRefs.current.delete(item.id);
        }}
        src={index === activeIndex && item.id === activeId ? reel.url : undefined}
        loop
        muted
        playsInline
        draggable={false}
        preload={index === activeIndex ? 'auto' : 'none'}
        onLoadStart={(event) => {
          setFailed((current) => withoutMapKey(current, item.id));
          logReel('info', '[Reels/video] carregamento iniciado', {
            position: index + 1,
            fileName: reel.fileName,
            configuredSrc: reel.url,
            media: describeVideoState(event.currentTarget),
          });
        }}
        onLoadedMetadata={(event) => {
          logReel('info', '[Reels/video] metadados carregados', {
            position: index + 1,
            fileName: reel.fileName,
            duration: event.currentTarget.duration,
            videoWidth: event.currentTarget.videoWidth,
            videoHeight: event.currentTarget.videoHeight,
            media: describeVideoState(event.currentTarget),
          });
        }}
        onCanPlay={(event) => {
          if (event.currentTarget.videoWidth === 0 || event.currentTarget.videoHeight === 0) {
            const codecError = 'A faixa de vídeo não pôde ser decodificada (codec sem suporte no Electron).';
            logReel('error', '[Reels/video] mídia sem quadros de vídeo decodificáveis', {
              position: index + 1,
              fileName: reel.fileName,
              error: codecError,
              media: describeVideoState(event.currentTarget),
            });
            setFailed((current) => new Map(current).set(item.id, codecError));
            return;
          }
          setFailed((current) => withoutMapKey(current, item.id));
          logReel('info', '[Reels/video] vídeo carregado com sucesso', {
            position: index + 1,
            fileName: reel.fileName,
            media: describeVideoState(event.currentTarget),
          });
        }}
        onPlaying={(event) => {
          logReel('info', '[Reels/video] reprodução iniciada', {
            position: index + 1,
            fileName: reel.fileName,
            media: describeVideoState(event.currentTarget),
          });
        }}
        onError={(event) => {
          const details = describeVideoState(event.currentTarget);
          const exactError = details.error?.message || details.error?.name || 'Erro de mídia sem mensagem.';
          logReel('error', '[Reels/video] falha ao carregar vídeo', {
            position: index + 1,
            fileName: reel.fileName,
            configuredSrc: reel.url,
            media: details,
          });
          setFailed((current) => new Map(current).set(item.id, exactError));
        }}
      />
      {failed.has(item.id) && (
        <div className="reel__error" role="status">
          <strong>Não foi possível reproduzir este vídeo</strong>
          <small>{reel.fileName}</small>
          <small>{failed.get(item.id)}</small>
        </div>
      )}
      <div className="reel__shade" />
      <div className="reel__meta">
        <div className="reel__user"><span>BS</span><strong>@baistudy.reels</strong><button type="button">Seguir</button></div>
        <p>{reel.displayName}</p>
        <small>♫ áudio original · arquivo local</small>
      </div>
      <aside className="reel__actions" aria-label="Ações visuais do Reel">
        <button type="button" tabIndex={-1}><InstagramIcon name="heart" /><small>12,4 mil</small></button>
        <button type="button" tabIndex={-1}><InstagramIcon name="comment" /><small>318</small></button>
        <button type="button" tabIndex={-1}><InstagramIcon name="share" /></button>
        <button type="button" tabIndex={-1}><InstagramIcon name="more" /></button>
        <button type="button" aria-label={muted ? 'Ativar áudio' : 'Silenciar'} onClick={() => setMuted((value) => !value)}>
          <InstagramIcon name={muted ? 'muted' : 'volume'} />
        </button>
      </aside>
    </>
  );
}

function StudyReel({ content, position }: { content: StudyReelContent; position: number }): React.JSX.Element {
  return (
    <div className="study-reel">
      <span className="study-reel__badge">Conteúdo de estudo</span>
      <div className="study-reel__book" aria-hidden="true">Aa</div>
      <small>{content.topic}</small>
      <h2>{content.title}</h2>
      <p>{content.summary}</p>
      <div className="study-reel__action">{content.action}</div>
      <span className="study-reel__position">Reel {position} · BaiStudy</span>
    </div>
  );
}

interface ProcrastinationDialogProps {
  eyebrow: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction(): void;
  disabled?: boolean;
  error?: string;
}

function ProcrastinationDialog({
  eyebrow,
  title,
  message,
  actionLabel,
  onAction,
  disabled = false,
  error = '',
}: ProcrastinationDialogProps): React.JSX.Element {
  return (
    <div className="procrastination-modal" role="dialog" aria-modal="true" aria-labelledby="procrastination-title">
      <div className="procrastination-modal__card">
        <span>{eyebrow}</span>
        <h2 id="procrastination-title">{title}</h2>
        <p>{message}</p>
        {error && <small role="alert">{error}</small>}
        <button type="button" disabled={disabled} onClick={onAction}>{actionLabel}</button>
      </div>
    </div>
  );
}

function FeedMessage({ title, detail }: { title: string; detail: string }): React.JSX.Element {
  return <div className="reels-message"><InstagramIcon name="reels" /><strong>{title}</strong><p>{detail}</p></div>;
}

function withoutMapKey(map: Map<string, string>, key: string): Map<string, string> {
  if (!map.has(key)) return map;
  const next = new Map(map);
  next.delete(key);
  return next;
}

async function recordMilestone(milestone: ProcrastinationMilestone): Promise<void> {
  try {
    const state = await window.baiStudyInstagram?.recordProcrastinationMilestone(milestone);
    logReel('info', '[Reels/anti-procrastination] marco confirmado pelo processo principal', {
      milestone,
      state,
    });
  } catch (error) {
    logReel('error', '[Reels/anti-procrastination] falha ao registrar marco', {
      milestone,
      error: describeUnknownError(error),
    });
  }
}

function describeVideoState(video: HTMLVideoElement): {
  currentSrc: string;
  networkState: number;
  readyState: number;
  error: { code: number; name: string; message: string } | null;
} {
  const mediaError = video.error;
  return {
    currentSrc: video.currentSrc,
    networkState: video.networkState,
    readyState: video.readyState,
    error: mediaError ? {
      code: mediaError.code,
      name: mediaErrorName(mediaError.code),
      message: mediaError.message,
    } : null,
  };
}

function mediaErrorName(code: number): string {
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED: return 'MEDIA_ERR_ABORTED';
    case MediaError.MEDIA_ERR_NETWORK: return 'MEDIA_ERR_NETWORK';
    case MediaError.MEDIA_ERR_DECODE: return 'MEDIA_ERR_DECODE';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
    default: return 'MEDIA_ERR_UNKNOWN';
  }
}

function describeUnknownError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function logReel(level: 'info' | 'error', message: string, details: unknown): void {
  console[level](`${message} ${JSON.stringify(details)}`);
}
