import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist-renderer');

await mkdir(resolve(output, 'reels'), { recursive: true });
await cp(resolve(root, 'assets', 'reels'), resolve(output, 'reels'), { recursive: true, force: true });
await rm(resolve(output, 'study', '.study-reward.mp4.ZKgK9t'), { force: true });
await writeFile(resolve(output, '.nojekyll'), '', 'utf8');

console.log('Assets da demonstração web preparados.');
