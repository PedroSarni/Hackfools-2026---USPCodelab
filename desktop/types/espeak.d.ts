declare module '@echogarden/espeak-ng-emscripten' {
  interface EspeakEngine {
    set_voice(value: string): void;
    set_rate(value: number): void;
    set_pitch(value: number): void;
    set_range(value: number): void;
    synthesize(text: string, callback: (samples: Int16Array) => void): void;
  }
  interface EspeakModule { eSpeakNGWorker: new () => EspeakEngine; }
  export default function initialize(): Promise<EspeakModule>;
}
