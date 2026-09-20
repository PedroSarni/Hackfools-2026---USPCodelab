/// <reference lib="webworker" />

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { observationFromLandmarks } from './pose-metrics';
import type { VisionWorkerRequest, VisionWorkerResponse } from './types';

let faceLandmarker: FaceLandmarker | null = null;

self.onmessage = async (event: MessageEvent<VisionWorkerRequest>): Promise<void> => {
  const message = event.data;
  try {
    if (message.type === 'init') {
      const vision = await FilesetResolver.forVisionTasks(message.wasmBaseUrl);
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: message.modelUrl, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      respond({ type: 'initialized' });
      return;
    }

    if (message.type === 'frame') {
      if (!faceLandmarker) throw new Error('Detector ainda não foi inicializado.');
      const started = performance.now();
      const result = faceLandmarker.detectForVideo(message.bitmap, message.capturedAt);
      const processingMs = performance.now() - started;
      const observation = observationFromLandmarks(
        result.faceLandmarks[0],
        message.capturedAt,
        processingMs,
        message.diagnostics,
      );
      message.bitmap.close();
      respond({ type: 'result', observation });
      return;
    }

    faceLandmarker?.close();
    faceLandmarker = null;
  } catch (error) {
    if (message.type === 'frame') message.bitmap.close();
    respond({
      type: 'error',
      message: error instanceof Error ? error.message : 'Falha desconhecida no detector.',
      fatal: message.type === 'init',
    });
  }
};

function respond(message: VisionWorkerResponse): void {
  self.postMessage(message);
}

export {};
