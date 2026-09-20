import { cp, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const target = resolve(root, 'public/models/wasm');

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });

const model = resolve(root, 'public/models/face_landmarker.task');
try {
  await stat(model);
} catch {
  throw new Error(
    'Modelo ausente em public/models/face_landmarker.task. Consulte docs/testing.md para prepará-lo.',
  );
}

console.log('Assets locais do MediaPipe preparados.');
