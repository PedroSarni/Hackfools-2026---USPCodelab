import { createHash } from 'node:crypto';
import type { Dirent } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises';
import { basename, extname, isAbsolute, parse, relative, resolve } from 'node:path';
import type { ReelAsset } from '../../shared/contracts';

const SUPPORTED_EXTENSIONS = new Set(['.mp4', '.webm']);

export class ReelsService {
  constructor(private readonly directory: string) {}

  getDirectory(): string {
    return this.directory;
  }

  async list(): Promise<ReelAsset[]> {
    const absoluteDirectory = resolve(this.directory);
    await mkdir(absoluteDirectory, { recursive: true });

    let entries: Dirent[];
    try {
      entries = await readdir(absoluteDirectory, { withFileTypes: true });
    } catch (error) {
      console.error('[ReelsService] falha ao ler pasta', {
        absoluteDirectory,
        relativeDirectory: relative(process.cwd(), absoluteDirectory) || '.',
        error: describeError(error),
      });
      throw error;
    }

    console.info('[ReelsService] conteúdo completo da pasta', {
      absoluteDirectory,
      relativeDirectory: relative(process.cwd(), absoluteDirectory) || '.',
      entries: entries.map((entry) => ({
        name: entry.name,
        absolutePath: resolve(absoluteDirectory, entry.name),
        relativePath: relative(process.cwd(), resolve(absoluteDirectory, entry.name)),
        type: entry.isFile() ? 'file' : entry.isDirectory() ? 'directory' : 'other',
        extension: extname(entry.name),
        supported: entry.isFile() && isSupportedFile(entry.name),
      })),
    });

    const assets = entries
      .filter((entry) => entry.isFile() && isSupportedFile(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR', { numeric: true }))
      .map((entry) => ({
        id: createHash('sha256').update(entry.name).digest('hex').slice(0, 16),
        fileName: entry.name,
        displayName: displayName(entry.name),
        url: `foco://bundle/__reels__/${encodeURIComponent(entry.name)}`,
      }));

    console.info('[ReelsService] lista de Reels construída', {
      count: assets.length,
      assets: assets.map((asset) => ({
        ...asset,
        absolutePath: resolve(absoluteDirectory, asset.fileName),
        relativePath: relative(process.cwd(), resolve(absoluteDirectory, asset.fileName)),
      })),
    });
    return assets;
  }

  resolveMediaPath(fileName: string): string | null {
    if (basename(fileName) !== fileName || !isSupportedFile(fileName)) {
      console.warn('[ReelsService] nome de mídia rejeitado', {
        fileName,
        isBaseName: basename(fileName) === fileName,
        extension: extname(fileName),
        supportedExtension: isSupportedFile(fileName),
      });
      return null;
    }
    const target = resolve(this.directory, fileName);
    const relativePath = relative(resolve(this.directory), target);
    const safe = !relativePath.startsWith('..') && !isAbsolute(relativePath);
    if (!safe) {
      console.warn('[ReelsService] caminho de mídia rejeitado', {
        fileName,
        directory: resolve(this.directory),
        absolutePath: target,
        relativePath,
      });
    }
    return safe ? target : null;
  }
}

function isSupportedFile(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.has(extname(fileName).toLowerCase());
}

function displayName(fileName: string): string {
  return parse(fileName).name.replace(/[-_]+/g, ' ').trim() || 'Reel local';
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
