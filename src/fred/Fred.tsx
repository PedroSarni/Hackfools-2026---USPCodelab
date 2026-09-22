import { useEffect, useRef, useState } from 'react';
import type { FredAudio, FredState } from '../../shared/contracts';
import { MatteVideo } from './MatteVideo';

const ASSETS = {
  idle: './fred/realistic_skeleton_transparent_base.png',
  observing: './fred/realistic_skeleton_transparent_base.png',
  happy: './fred/03_realistic_sunglasses.gif',
  angry: './fred/02_realistic_head_saying_no.gif',
  disappointed: './fred/02_realistic_head_saying_no.gif',
  resting: './fred/03_realistic_sunglasses.gif',
  scrolling: './fred/01_realistic_scrolling_short_videos.gif',
  talking: './fred/04_realistic_talking.gif',
} as const;

function loadSavedVideoSkin(): string {
  const saved = localStorage.getItem('freddyVideoSkin') || '';
  if (!['asa', 'descolado', 'fogo', 'rock', 'bike'].some(id => saved === `freddy_${id}`)) {
    localStorage.removeItem('freddyVideoSkin');
    return '';
  }
  return saved;
}

export function Fred(): React.JSX.Element {
  const [state, setState] = useState<FredState | null>(null);
  const [skinVideo, setSkinVideo] = useState(loadSavedVideoSkin);
  useEffect(() => {
    const onSkin = (): void => setSkinVideo(loadSavedVideoSkin());
    window.addEventListener('freddy:skin', onSkin);
    return () => window.removeEventListener('freddy:skin', onSkin);
  }, []);
  const audioContext = useRef<AudioContext | undefined>(undefined);
  const source = useRef<AudioBufferSourceNode | undefined>(undefined);
  const generation = useRef(0);

  useEffect(() => {
    const bridge = window.baiStudyFred;
    if (!bridge) return;
    void bridge.getState().then(setState);
    const removeState = bridge.onState(setState);
    const removeAudio = bridge.onAudio((audio) => void playAudio(audio));
    return () => { removeState(); removeAudio(); stopAudio(); void audioContext.current?.close(); };
  }, []);

  const stopAudio = (): void => {
    generation.current += 1;
    if (source.current) {
      source.current.onended = null;
      try { source.current.stop(); } catch { /* já terminou */ }
      source.current.disconnect();
      source.current = undefined;
    }
  };

  const playAudio = async (audio: FredAudio | { stop: true }): Promise<void> => {
    stopAudio();
    if ('stop' in audio) return;
    const request = generation.current;
    try {
      audioContext.current ??= new AudioContext();
      await audioContext.current.resume();
      if (request !== generation.current) return;
      const buffer = audioContext.current.createBuffer(1, audio.pcm.byteLength / Float32Array.BYTES_PER_ELEMENT, audio.sampleRate);
      buffer.copyToChannel(new Float32Array(audio.pcm), 0);
      const next = audioContext.current.createBufferSource();
      const volume = audioContext.current.createGain();
      volume.gain.value = 0.7;
      next.buffer = buffer;
      next.connect(volume);
      volume.connect(audioContext.current.destination);
      source.current = next;
      next.onended = () => {
        if (source.current === next) source.current = undefined;
        next.disconnect();
        volume.disconnect();
        window.baiStudyFred?.reportVoicePlayback(audio.id, 'ended');
      };
      next.start();
      window.baiStudyFred?.reportVoicePlayback(audio.id, 'playing');
    } catch {
      window.baiStudyFred?.reportVoicePlayback(audio.id, 'error');
    }
  };

  if (!state) return <div className="fred-loading">Reunindo os ossos…</div>;
  const automaticAsset = state.voiceStatus === 'playing' ? ASSETS.talking : state.activity === 'scrolling' ? ASSETS.scrolling : ASSETS[state.mood];

  if (!state.visible) return <></>;
  return <main className="desktop-freddy">
    <div className="desktop-freddy-speech" role="status"><b>Freddy</b><p>{state.message}</p></div>
    <button className="desktop-freddy-character" aria-label="Abrir skins do Freddy" onMouseEnter={() => window.baiStudyFred?.hover(true)} onMouseLeave={() => window.baiStudyFred?.hover(false)} onFocus={() => window.baiStudyFred?.hover(true)} onBlur={() => window.baiStudyFred?.hover(false)} onClick={() => window.dispatchEvent(new Event('freddy:shop'))}>
      {state.activity === 'scrolling' ? <img src={ASSETS.scrolling} alt="Freddy scrollando"/> : skinVideo === 'freddy_bike' ? <MatteVideo src="./fred/freddy_bike.webm" sideInset={0.14} loop label="Freddy ciclista" /> : skinVideo ? <video key={skinVideo} src={`./fred/${skinVideo}.webm`} autoPlay loop muted playsInline /> : <img src={automaticAsset} alt="Freddy" draggable={false} />}
    </button>
  </main>;
}
