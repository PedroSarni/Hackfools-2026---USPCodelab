import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttentionSignal, CameraPreferences, FredReaction } from '../../shared/contracts';
import { AttentionEstimator } from './attention-estimator';
import { CalibrationSession, type CalibrationProgress } from './calibration';
import { CalibrationPanel } from './CalibrationPanel';
import { CameraController, CameraError } from './camera-controller';
import { DiagnosticOverlay } from './DiagnosticOverlay';
import type { AttentionEstimate, VisionObservation } from './types';
import { VisionController } from './vision-controller';

const STATUS_LABEL: Record<AttentionSignal['status'], string> = {
  screen: 'Você está presente',
  down: 'Cabeça inclinada para baixo',
  away: 'Fora da direção frontal',
  absent: 'Rosto não detectado',
  uncertain: 'Detecção incerta',
};

const INITIAL_PROGRESS: CalibrationProgress = {
  step: 'idle',
  capturing: false,
  collected: 0,
  required: 18,
};

export function CameraView(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraController | null>(null);
  const visionRef = useRef<VisionController | null>(null);
  const visionInitializationRef = useRef<Promise<void> | null>(null);
  const estimatorRef = useRef(new AttentionEstimator());
  const calibrationRef = useRef(new CalibrationSession());
  const [preferences, setPreferences] = useState<CameraPreferences>({ mirrored: true, diagnostics: false });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [active, setActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState('');
  const [observation, setObservation] = useState<VisionObservation | null>(null);
  const [estimate, setEstimate] = useState<AttentionEstimate>(() => estimatorRef.current.unavailable());
  const [calibration, setCalibration] = useState<CalibrationProgress>(INITIAL_PROGRESS);
  const [reaction, setReaction] = useState<FredReaction | null>(null);
  const [showControls, setShowControls] = useState(false);

  const publishUnavailable = useCallback((): void => {
    const next = estimatorRef.current.unavailable();
    setEstimate(next);
    window.baiStudyCamera?.publishAttention(next.signal);
  }, []);

  const handleObservation = useCallback((nextObservation: VisionObservation): void => {
    setObservation(nextObservation);
    const profile = calibrationRef.current.ingest(nextObservation);
    setCalibration(calibrationRef.current.getProgress());
    if (profile) estimatorRef.current.setCalibration(profile);
    const nextEstimate = estimatorRef.current.update(nextObservation);
    setEstimate(nextEstimate);
    window.baiStudyCamera?.publishAttention(nextEstimate.signal);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const camera = new CameraController(video);
    camera.onDisconnected = () => {
      setActive(false);
      setError('A câmera foi desconectada ou deixou de produzir imagem.');
      visionRef.current?.stop();
      publishUnavailable();
    };
    cameraRef.current = camera;

    window.baiStudyCamera?.getPreferences().then((stored) => {
      const clean = { ...stored, diagnostics: false };
      setPreferences(clean);
      return window.baiStudyCamera?.updatePreferences({ diagnostics: false });
    }).catch(() => undefined);
    const unsubscribe = window.baiStudyCamera?.onFredReaction((nextReaction) => {
      setReaction(nextReaction);
      window.setTimeout(() => setReaction((current) => current?.reactionId === nextReaction.reactionId ? null : current), 5_000);
    });

    return () => {
      unsubscribe?.();
      visionRef.current?.dispose();
      camera.stop();
    };
  }, [publishUnavailable]);

  useEffect(() => {
    visionRef.current?.setDiagnostics(preferences.diagnostics);
  }, [preferences.diagnostics]);

  const ensureVision = async (): Promise<void> => {
    if (visionInitializationRef.current) return visionInitializationRef.current;
    if (visionRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    const vision = new VisionController(video, handleObservation, (message) => {
      if (visionRef.current === vision) {
        visionRef.current.dispose();
        visionRef.current = null;
        setModelReady(false);
      }
      setError(`Detector: ${message}`);
    });
    visionRef.current = vision;
    const initialization = vision.initialize().then(() => {
      vision.setDiagnostics(preferences.diagnostics);
      setModelReady(true);
    }).catch((caught) => {
      if (visionRef.current === vision) visionRef.current = null;
      vision.dispose();
      throw caught;
    }).finally(() => {
      if (visionInitializationRef.current === initialization) visionInitializationRef.current = null;
    });
    visionInitializationRef.current = initialization;
    return initialization;
  };

  const startCamera = async (deviceId = preferences.deviceId): Promise<void> => {
    try {
      setError('');
      const availableDevices = await cameraRef.current?.start(deviceId);
      setDevices(availableDevices ?? []);
      setActive(true);
      await ensureVision();
      visionRef.current?.start();
    } catch (caught) {
      cameraRef.current?.stop();
      visionRef.current?.stop();
      setActive(false);
      publishUnavailable();
      setError(
        caught instanceof CameraError
          ? caught.message
          : `Não foi possível iniciar câmera e detector: ${caught instanceof Error ? caught.message : 'falha desconhecida'}`,
      );
    }
  };

  const updatePreferences = async (patch: Partial<CameraPreferences>): Promise<void> => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    try {
      const persisted = await window.baiStudyCamera?.updatePreferences(patch);
      if (persisted) setPreferences(persisted);
    } catch {
      setError('Não foi possível salvar a preferência da câmera.');
    }
  };

  const selectDevice = async (deviceId: string): Promise<void> => {
    await updatePreferences({ deviceId });
    if (active) await startCamera(deviceId);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void startCamera(); }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  const beginCalibration = (): void => {
    estimatorRef.current.clearCalibration();
    calibrationRef.current.begin();
    setCalibration(calibrationRef.current.getProgress());
  };

  const closeWindow = async (): Promise<void> => {
    visionRef.current?.stop();
    cameraRef.current?.stop();
    setActive(false);
    publishUnavailable();
    await window.baiStudyCamera?.closeWindow();
  };

  return (
    <main className="camera-view camera-view--compact">
      <div className="video-stage">
        <video
          ref={videoRef}
          className={preferences.mirrored ? 'is-mirrored' : ''}
          playsInline
          muted
          aria-label="Prévia da câmera"
        />
        {preferences.diagnostics && <DiagnosticOverlay observation={observation} mirrored={preferences.mirrored} />}
        {error && <p className="camera-error" role="alert">{error}</p>}
        {!active && (
          <div className="camera-empty">
            <span className="camera-icon" aria-hidden="true">●</span>
            <h1>Ligando fiscalização…</h1>
            <p>Freddy está procurando sua webcam.</p>
          </div>
        )}

        <div className="status-pill" data-status={active ? estimate.signal.status : 'off'}>
          <span />
          {!active ? 'Câmera obrigatória' : !modelReady ? 'Detector carregando' : STATUS_LABEL[estimate.signal.status]}
        </div>

        <button className="camera-minimize" type="button" title="Minimizar sem desligar" aria-label="Minimizar câmera" onClick={() => void window.baiStudyCamera?.minimizeWindow()}>—</button>
        <button className="camera-settings-button" type="button" aria-label="Configurações da câmera" onClick={() => setShowControls((value) => !value)}>⚙</button>
        <button className="camera-close-compact" type="button" aria-label="Fechar câmera" title="Fechar câmera" onClick={() => void closeWindow()}>×</button>

        {active && preferences.diagnostics && (
          <aside className="diagnostic-panel">
            <span>DIAGNÓSTICO LOCAL</span>
            <dl>
              <div><dt>Estado estável</dt><dd>{STATUS_LABEL[estimate.signal.status]}</dd></div>
              <div><dt>Candidato</dt><dd>{STATUS_LABEL[estimate.candidate]}</dd></div>
              <div><dt>Qualidade do sinal</dt><dd>{observation?.detected ? `${Math.round(observation.quality * 100)}%` : 'n/d'}</dd></div>
              <div><dt>Permanência</dt><dd>{(estimate.candidateForMs / 1000).toFixed(1)} s</dd></div>
              <div><dt>Processamento</dt><dd>{observation ? `${observation.processingMs.toFixed(0)} ms` : '—'}</dd></div>
              <div><dt>Calibração</dt><dd>{estimate.signal.calibrated ? 'ativa' : 'pendente'}</dd></div>
            </dl>
            <p>Qualidade é uma heurística geométrica, não uma probabilidade de atenção.</p>
          </aside>
        )}

        {reaction && (
          <div className="reaction-toast">
            <span>EVENTO ENVIADO AO FRED</span>
            {reaction.message}
          </div>
        )}
      </div>

      {showControls && <section className="camera-controls camera-controls--floating" aria-label="Controles da câmera">
        <div className="control-row">
          <label>
            <span>Dispositivo</span>
            <select
              value={preferences.deviceId ?? ''}
              onChange={(event) => void selectDevice(event.target.value)}
              disabled={!active || devices.length < 2}
            >
              {devices.length === 0 && <option value="">Câmera padrão</option>}
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Câmera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.mirrored}
              onChange={(event) => void updatePreferences({ mirrored: event.target.checked })}
            />
            Espelhar prévia
          </label>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.diagnostics}
              onChange={(event) => void updatePreferences({ diagnostics: event.target.checked })}
            />
            Diagnóstico
          </label>
        </div>

        <p>Detecção automática de presença. Não é necessário calibrar.</p>
        {error && <p className="camera-error" role="alert">{error}</p>}
      </section>}
    </main>
  );
}
