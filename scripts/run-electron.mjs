import { spawn } from 'node:child_process';
import electron from 'electron';

const { ELECTRON_RUN_AS_NODE: _ignored, ...cleanEnvironment } = process.env;
const child = spawn(electron, process.argv.slice(2), {
  stdio: 'inherit',
  env: cleanEnvironment,
  windowsHide: false,
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('Não foi possível iniciar o Electron.', error);
  process.exit(1);
});
