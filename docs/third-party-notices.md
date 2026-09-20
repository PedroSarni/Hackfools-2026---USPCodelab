# Dependências e modelos

## MediaPipe Tasks Vision

- Pacote: `@mediapipe/tasks-vision` 1.0.1.
- Projeto: <https://github.com/google-ai-edge/mediapipe>
- Licença declarada do pacote/projeto: Apache License 2.0.
- Uso: landmarks faciais localmente via WebAssembly.

## Face Landmarker

- Artefato: `face_landmarker.task`, variante float16, versão 1.
- Origem: <https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task>
- SHA-256: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
- Model card relacionado: <https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf>

O SDK e o repositório MediaPipe são Apache-2.0. Como o download do modelo não acompanha neste projeto um arquivo de licença específico do artefato, confirme os termos de redistribuição do modelo com a fonte oficial antes de publicar ou distribuir comercialmente o instalador.

As demais licenças estão registradas nos metadados do `package-lock.json`/pacotes instalados. Nenhuma imagem da webcam é enviada pelo código do BaiStudy; o modelo e o WASM são carregados de `app://bundle/models`.
