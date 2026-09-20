import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ReelsService } from './reels-service';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function temporaryReelsDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'baistudy-reels-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('ReelsService', () => {
  it('enumera mp4 e webm dinamicamente e ignora outros arquivos', async () => {
    const directory = await temporaryReelsDirectory();
    await Promise.all([
      writeFile(join(directory, 'reel10.mp4'), ''),
      writeFile(join(directory, 'reel2.webm'), ''),
      writeFile(join(directory, 'anotacoes.txt'), ''),
      writeFile(join(directory, 'video.mov'), ''),
    ]);

    const reels = await new ReelsService(directory).list();
    expect(reels.map((reel) => reel.fileName)).toEqual(['reel2.webm', 'reel10.mp4']);
    expect(reels[0].url).toBe('app://bundle/__reels__/reel2.webm');
  });

  it('retorna estado vazio sem falhar quando a pasta não existe', async () => {
    const root = await temporaryReelsDirectory();
    await expect(new ReelsService(join(root, 'ausente')).list()).resolves.toEqual([]);
  });

  it('não resolve extensões ou caminhos fora da pasta permitida', async () => {
    const directory = await temporaryReelsDirectory();
    const service = new ReelsService(directory);
    expect(service.resolveMediaPath('../segredo.mp4')).toBeNull();
    expect(service.resolveMediaPath('imagem.png')).toBeNull();
    expect(service.resolveMediaPath('reel.mp4')).toBe(join(directory, 'reel.mp4'));
  });
});
