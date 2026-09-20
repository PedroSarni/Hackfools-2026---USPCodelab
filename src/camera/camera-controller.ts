export type CameraErrorKind = 'permission' | 'missing' | 'busy' | 'disconnected' | 'unknown';

export class CameraError extends Error {
  constructor(
    public readonly kind: CameraErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export class CameraController {
  private stream: MediaStream | null = null;

  constructor(private readonly video: HTMLVideoElement) {}

  async start(deviceId?: string): Promise<MediaDeviceInfo[]> {
    this.stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CameraError('missing', 'Este sistema não disponibiliza captura de câmera.');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          width: { ideal: 960 },
          height: { ideal: 540 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
      this.video.srcObject = this.stream;
      for (const track of this.stream.getVideoTracks()) {
        track.addEventListener('ended', this.handleEnded, { once: true });
      }
      await this.video.play();
      return this.listDevices();
    } catch (error) {
      this.stop();
      throw normalizeCameraError(error);
    }
  }

  async listDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    return (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
  }

  stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.removeEventListener('ended', this.handleEnded);
        track.stop();
      }
    }
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }

  isActive(): boolean {
    return this.stream?.getVideoTracks().some((track) => track.readyState === 'live') ?? false;
  }

  onDisconnected?: () => void;

  private handleEnded = (): void => {
    this.stop();
    this.onDisconnected?.();
  };
}

function normalizeCameraError(error: unknown): CameraError {
  if (error instanceof CameraError) return error;
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new CameraError('permission', 'Permissão da câmera negada. Autorize o acesso e tente novamente.');
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return new CameraError('missing', 'A câmera escolhida não está disponível.');
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return new CameraError('busy', 'A câmera está ocupada por outro aplicativo ou não pôde ser iniciada.');
  }
  return new CameraError('unknown', error instanceof Error ? error.message : 'Não foi possível iniciar a câmera.');
}
