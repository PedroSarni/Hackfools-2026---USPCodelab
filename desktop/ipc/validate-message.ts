import type { IpcMainEvent, IpcMainInvokeEvent, WebFrameMain } from 'electron';
import { ATTENTION_STATUSES, type AttentionSignal, type CameraPreferences } from '../../shared/contracts';

type IpcEvent = IpcMainEvent | IpcMainInvokeEvent;

export function assertTrustedSender(
  event: IpcEvent,
  allowedWebContentsIds: ReadonlySet<number>,
): void {
  if (!allowedWebContentsIds.has(event.sender.id) || !isTrustedFrame(event.senderFrame)) {
    throw new Error('Mensagem IPC rejeitada: origem não autorizada.');
  }
}

function isTrustedFrame(frame: WebFrameMain | null): boolean {
  if (!frame || frame !== frame.top) return false;

  try {
    const url = new URL(frame.url);
    if (url.protocol === 'app:' && url.hostname === 'bundle') return true;
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' && url.port === '5173';
  } catch {
    return false;
  }
}

export function validatePreferencePatch(value: unknown): Partial<CameraPreferences> {
  if (!isRecord(value)) throw new Error('Preferências de câmera inválidas.');
  const allowed = new Set(['mirrored', 'diagnostics', 'deviceId']);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new Error('Preferência de câmera desconhecida.');
  }

  const patch: Partial<CameraPreferences> = {};
  if ('mirrored' in value) {
    if (typeof value.mirrored !== 'boolean') throw new Error('Espelhamento inválido.');
    patch.mirrored = value.mirrored;
  }
  if ('diagnostics' in value) {
    if (typeof value.diagnostics !== 'boolean') throw new Error('Diagnóstico inválido.');
    patch.diagnostics = value.diagnostics;
  }
  if ('deviceId' in value) {
    if (value.deviceId !== undefined && (typeof value.deviceId !== 'string' || value.deviceId.length > 512)) {
      throw new Error('Identificador de câmera inválido.');
    }
    patch.deviceId = value.deviceId;
  }
  return patch;
}

export function validateAttentionSignal(value: unknown): AttentionSignal {
  if (!isRecord(value)) throw new Error('Sinal de atenção inválido.');
  const status = value.status;
  if (typeof status !== 'string' || !ATTENTION_STATUSES.includes(status as AttentionSignal['status'])) {
    throw new Error('Estado de atenção inválido.');
  }
  if (!isFiniteRange(value.confidence, 0, 1)) throw new Error('Qualidade do sinal inválida.');
  if (!isFiniteRange(value.observedAt, 0, Number.MAX_SAFE_INTEGER)) throw new Error('Timestamp inválido.');
  if (!isFiniteRange(value.stableForMs, 0, 3_600_000)) throw new Error('Duração estável inválida.');
  if (typeof value.calibrated !== 'boolean' || typeof value.available !== 'boolean') {
    throw new Error('Metadados do sinal inválidos.');
  }
  if (value.source !== 'camera' && value.source !== 'simulation') throw new Error('Origem inválida.');

  return {
    status: status as AttentionSignal['status'],
    confidence: value.confidence as number,
    observedAt: value.observedAt as number,
    stableForMs: value.stableForMs as number,
    calibrated: value.calibrated,
    available: value.available,
    source: value.source,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
