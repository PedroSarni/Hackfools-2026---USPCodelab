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

As demais licenças estão registradas nos metadados do `package-lock.json`/pacotes instalados. Nenhuma imagem da webcam é enviada pelo código do FreddyBuddy; o modelo e o WASM são carregados de `app://bundle/models`.

## eSpeak NG Emscripten

- Pacote: `@echogarden/espeak-ng-emscripten` 0.3.5.
- Licença declarada pelo pacote: GNU General Public License 3.0.
- Uso: síntese de voz local do Freddy em uma worker thread, sem serviço externo.

## Animações do Freddy

Os GIFs e a imagem-base em `public/fred` vieram do pacote entregue pela equipe do projeto. A equipe deve manter a autorização e os créditos da origem desses arquivos antes de publicar ou redistribuir o aplicativo.

## PDF.js

- Versão empacotada: 3.11.174.
- Projeto: <https://github.com/mozilla/pdf.js>
- Licença declarada: Apache License 2.0.
- Uso: renderização offline dos slides de `public/study/aula-pilhas.pdf`.

O PDF da aula e o vídeo `casino-ad.mp4` vieram do pacote entregue pela equipe do projeto. A equipe deve manter a autorização e os créditos da origem desses materiais antes de publicar ou redistribuir o aplicativo.

A imagem `public/study/simoes_linguarudo.jpeg` foi fornecida diretamente pela equipe para o anúncio clicável do cassino. A equipe deve manter a autorização de uso e os créditos antes de qualquer publicação.
