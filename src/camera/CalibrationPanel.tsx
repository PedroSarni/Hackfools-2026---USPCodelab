import type { CalibrationProgress } from './calibration';

interface CalibrationPanelProps {
  progress: CalibrationProgress;
  cameraActive: boolean;
  onBegin(): void;
  onCapture(): void;
  onSkipSides(): void;
}

const INSTRUCTIONS = {
  front: 'Mantenha a postura normal e olhe para esta tela.',
  down: 'Incline a cabeça para baixo como faria ao olhar uma anotação.',
  sides: 'Opcional: vire a cabeça para o lado que deseja usar como referência.',
} as const;

export function CalibrationPanel({
  progress,
  cameraActive,
  onBegin,
  onCapture,
  onSkipSides,
}: CalibrationPanelProps): React.JSX.Element {
  if (progress.step === 'idle' || progress.step === 'complete') {
    return (
      <div className="calibration-card">
        <div>
          <strong>{progress.step === 'complete' ? 'Calibração concluída' : 'Calibração necessária'}</strong>
          <p>A câmera deve permanecer estável. A referência vale para esta tela e somente nesta sessão.</p>
        </div>
        <button type="button" onClick={onBegin} disabled={!cameraActive}>
          {progress.step === 'complete' ? 'Refazer' : 'Iniciar'}
        </button>
      </div>
    );
  }

  const percent = Math.round((progress.collected / progress.required) * 100);
  return (
    <div className="calibration-card calibration-card--active">
      <div>
        <span className="step-label">CALIBRAÇÃO · {progress.step.toUpperCase()}</span>
        <strong>{INSTRUCTIONS[progress.step]}</strong>
        <p>{progress.capturing ? `Capturando referência… ${percent}%` : 'Ajuste a postura e inicie a captura.'}</p>
        {progress.error && <p className="error-message">{progress.error}</p>}
      </div>
      <div className="calibration-actions">
        <button type="button" onClick={onCapture} disabled={progress.capturing}>
          {progress.capturing ? 'Capturando…' : 'Capturar'}
        </button>
        {progress.step === 'sides' && !progress.capturing && (
          <button type="button" className="quiet-button" onClick={onSkipSides}>
            Pular lateral
          </button>
        )}
      </div>
    </div>
  );
}
