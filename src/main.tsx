import { createRoot } from 'react-dom/client';
import { Desktop } from './app/Desktop';
import { CameraView } from './camera/CameraView';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz não encontrado.');

const isCameraWindow = window.location.pathname.endsWith('camera.html');
createRoot(root).render(
  isCameraWindow ? <CameraView /> : <Desktop />,
);
