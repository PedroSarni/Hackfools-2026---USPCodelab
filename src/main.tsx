import { createRoot } from 'react-dom/client';
import { Desktop } from './app/Desktop';
import { CameraView } from './camera/CameraView';
import { installBrowserBridges } from './browser-bridge';
import './styles/global.css';

installBrowserBridges();

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz não encontrado.');

const isCameraWindow = window.location.pathname.endsWith('camera.html');
createRoot(root).render(
  isCameraWindow ? <CameraView /> : <Desktop />,
);
