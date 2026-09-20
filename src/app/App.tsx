import { useEffect, useState } from 'react';
import type { AppInfo } from '../../shared/contracts';

export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    window.baiStudyMain?.getAppInfo().then(setInfo).catch(() => setError('A ponte segura do Electron não respondeu.'));
  }, []);

  const openCamera = async (): Promise<void> => {
    try {
      setError('');
      await window.baiStudyMain?.openCamera();
    } catch {
      setError('Não foi possível abrir a janela da câmera.');
    }
  };

  return (
    <main className="launcher">
      <section className="launcher__content">
        <p className="eyebrow">BAISTUDY · PROTÓTIPO TÉCNICO</p>
        <h1>Câmera e sinais de atenção</h1>
        <p className="launcher__lead">
          As etapas 2 e 3 estão isoladas nesta versão: prévia da webcam, calibração pessoal e estimativa local de orientação da cabeça.
        </p>
        <button className="primary-button" type="button" onClick={openCamera}>
          Abrir câmera
        </button>
        {error && <p className="error-message">{error}</p>}
      </section>

      <aside className="scope-card" aria-label="Escopo desta versão">
        <span className="scope-card__number">02—03</span>
        <h2>Escopo deliberado</h2>
        <ul>
          <li>Imagem e análise ficam no dispositivo.</li>
          <li>Nenhum frame é gravado ou transmitido.</li>
          <li>“Qualidade” não significa probabilidade de distração.</li>
          <li>Fred ainda não é renderizado nesta versão.</li>
        </ul>
        {info && <small>Versão {info.version}</small>}
      </aside>
    </main>
  );
}
