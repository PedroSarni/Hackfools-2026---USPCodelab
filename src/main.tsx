import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { CameraView } from './camera/CameraView';
import { InstagramView } from './instagram/InstagramView';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz não encontrado.');

const isCameraWindow = window.location.pathname.endsWith('camera.html');
const isInstagramWindow = window.location.pathname.endsWith('instagram.html');
createRoot(root).render(
  isCameraWindow ? <CameraView /> : isInstagramWindow ? <InstagramView /> : <App />,
);
