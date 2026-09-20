import { createRoot } from 'react-dom/client';
import { Desktop } from './app/Desktop';
import { CameraView } from './camera/CameraView';
import { Fred } from './fred/Fred';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento raiz não encontrado.');

const isCameraWindow = window.location.pathname.endsWith('camera.html');
const isFredWindow = window.location.pathname.endsWith('fred.html');
createRoot(root).render(
  isFredWindow ? <Fred /> : isCameraWindow ? <CameraView /> : <Desktop />,
);
