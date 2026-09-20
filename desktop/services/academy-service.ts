import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ensureJupiterSchedule, initialAcademy, reduceAcademy, type AcademyAction, type AcademyState } from '../../shared/academy';

export class AcademyService {
 private state = initialAcademy();
 private queue: Promise<unknown> = Promise.resolve();
 constructor(private readonly path: string) {}
 async load(): Promise<void> {
  try {
   const data = JSON.parse(await readFile(this.path, 'utf8')) as AcademyState;
   if (data.version !== 1 || !Array.isArray(data.transactions) || !Array.isArray(data.missions) || !Array.isArray(data.subjects) || !Array.isArray(data.deadlines) || !Array.isArray(data.owned) || !data.profile) throw new Error('Arquivo acadêmico inválido. Dados preservados; restaure um backup.');
   this.state = ensureJupiterSchedule(data);
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
 }
 getState(): AcademyState { return structuredClone(this.state); }
 dispatch(action: AcademyAction): Promise<AcademyState> {
  const operation = this.queue.then(async () => {
   const next = reduceAcademy(this.state, action);
   await mkdir(dirname(this.path), { recursive: true });
   await writeFile(`${this.path}.tmp`, JSON.stringify(next, null, 2), 'utf8');
   await rename(`${this.path}.tmp`, this.path);
   this.state = next; return this.getState();
  });
  this.queue = operation.catch(() => undefined); return operation;
 }
}
