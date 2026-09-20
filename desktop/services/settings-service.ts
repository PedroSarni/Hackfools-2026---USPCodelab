import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CameraPreferences } from '../../shared/contracts';

interface SettingsFile {
  schemaVersion: 1;
  camera: CameraPreferences;
}

const DEFAULTS: SettingsFile = {
  schemaVersion: 1,
  camera: { mirrored: true, diagnostics: true },
};

export class SettingsService {
  private state: SettingsFile = structuredClone(DEFAULTS);

  constructor(private readonly filePath: string) {}

  async load(): Promise<void> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, 'utf8')) as Partial<SettingsFile>;
      if (parsed.schemaVersion === 1 && parsed.camera) {
        this.state = {
          schemaVersion: 1,
          camera: {
            mirrored: parsed.camera.mirrored !== false,
            diagnostics: parsed.camera.diagnostics !== false,
            ...(typeof parsed.camera.deviceId === 'string' ? { deviceId: parsed.camera.deviceId } : {}),
          },
        };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Não foi possível ler as configurações; usando padrões.', error);
      }
    }
  }

  getCameraPreferences(): CameraPreferences {
    return { ...this.state.camera };
  }

  async updateCameraPreferences(patch: Partial<CameraPreferences>): Promise<CameraPreferences> {
    this.state.camera = { ...this.state.camera, ...patch };
    if (patch.deviceId === undefined && Object.prototype.hasOwnProperty.call(patch, 'deviceId')) {
      delete this.state.camera.deviceId;
    }
    await this.save();
    return this.getCameraPreferences();
  }

  private async save(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    await writeFile(temporary, `${JSON.stringify(this.state, null, 2)}\n`, 'utf8');
    await rename(temporary, this.filePath);
  }
}
