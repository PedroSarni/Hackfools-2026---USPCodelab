# Arquitetura

## Escopo presente

Esta árvore implementa as etapas 2 e 3, uma área de trabalho educacional e uma distração isolada de Instagram simulado. A janela principal é o desktop do BaiStudy OS e não abre nenhum aplicativo automaticamente. Não há janela, imagem, animação nem posicionamento do Fred; `fred:reaction` é um contrato de integração marcado como `pending-fred`.

```text
desktop/
  main.ts                         ciclo de vida, protocolo local e permissão de vídeo
  windows/                       janelas principal, câmera e Instagram
  ipc/                           handlers específicos e validação de origem/dados
  services/settings-service.ts   preferências persistentes da câmera
  services/reels-service.ts      descoberta segura dos vídeos locais
  services/media-range.ts        interpretação de requisições parciais de mídia
  behavior/                      converte transições estáveis em reação futura
preload/
  main-preload.ts                abrir câmera/Instagram e consultar versão
  camera-preload.ts              preferências, fechamento, sinal e reação
  instagram-preload.ts           fechar Instagram e consultar Reels
shared/
  contracts.ts                   tipos serializáveis entre processos
  events.ts                      canais IPC permitidos
src/
  app/App.tsx                    área de trabalho e despacho dos launchers
  app/desktop-apps.ts            catálogo escalável de aplicativos
  camera/CameraView.tsx          interface e coordenação da webcam
  camera/camera-controller.ts    tracks, dispositivos e erros da webcam
  camera/vision-worker.ts        backend preferencial para MediaPipe
  camera/pose-metrics.ts         métricas relativas a partir dos landmarks
  camera/calibration.ts          referências pessoais da sessão
  camera/attention-estimator.ts  suavização, limiares, histerese e permanência
  camera/vision-controller.ts    agenda frames e descarta trabalho atrasado
  instagram/                     Home, navegação e feed de Reels
  styles/                        visual das duas janelas existentes
public/models/                   modelo e runtime WASM locais
public/desktop/                  wallpaper e ícones do desktop
public/instagram/home.jpeg       referência estática fornecida pelo usuário
assets/reels/                    vídeos inseridos manualmente pela equipe
docs/                            arquitetura, progresso, teste e licenças
```

Diretórios das etapas futuras não foram criados vazios. Quando uma etapa for autorizada, ela deve acrescentar apenas seus módulos dentro de `src/features`, `desktop/services` ou `desktop/behavior`, conforme a responsabilidade.

## Janelas

- **Principal:** desktop do BaiStudy OS com catálogo de aplicativos, atalhos e dock. É sempre a primeira janela.
- **Câmera:** janela dedicada; o vídeo ocupa a maior área. Fechar ou desligar interrompe todas as tracks.
- **Instagram:** BrowserWindow separada, frameless, com 426 × 856 px iniciais e limites verticais. Ela só é criada por um gesto no desktop. A Home é a imagem fornecida, Reels troca a área de conteúdo na mesma janela e o botão **Desktop** fecha a janela, revelando a principal.
- **Fred:** inexistente por decisão explícita do escopo atual.

Os renderers mantêm `nodeIntegration: false`, `contextIsolation: true` e `sandbox: true`. Recursos empacotados são servidos pelo protocolo seguro `app://bundle`; em desenvolvimento somente `http://127.0.0.1:5173` é aceito. Navegações e novas janelas são bloqueadas.

## Fluxo do Instagram e dos Reels

```text
ícone no desktop (catálogo desktopApps)
  → main-preload.openInstagram()
  → IPC main:open-instagram validado
  → BrowserWindow vertical instagram.html
  → Home estática
  → botão Reels
  → instagram-preload.getReels()
  → ReelsService enumera assets/reels
  → metadados e URLs app://bundle/__reels__/...
  → feed com scroll snap e índice ativo
```

As “rotas” do aplicativo são entradas Electron/Vite separadas: `index.html` representa o desktop, `instagram.html` representa o Instagram e `camera.html` representa o Foco Total. O renderer seleciona a view pelo pathname, enquanto a criação das janelas passa exclusivamente por IPCs tipados dos preloads.

O renderer recebe somente `id`, nome, título derivado e URL local. Não recebe `fs`, caminho absoluto ou IPC genérico. O handler valida nome simples e extensão antes de servir o arquivo. O streaming responde `200` ou `206 Partial Content`, com `Content-Type`, `Content-Length`, `Accept-Ranges` e `Content-Range` corretos.

São aceitos arquivos regulares `.mp4` e `.webm`, sem distinção de maiúsculas. Outras extensões, subpastas e tentativas de traversal são ignoradas. Para compatibilidade, MP4 deve usar H.264/AAC-LC e WebM deve usar VP8/VP9 com Opus; HEVC/H.265 não fornece imagem de forma portátil no Electron.

Cada Reel ocupa 100% da área acima da navegação, preserva a proporção com `object-fit: contain` e usa `scroll-snap-stop: always`. O índice ativo acompanha scroll, setas e arraste. Somente o item ativo recebe `src`, o que evita abrir vários pipelines de decodificação ao mesmo tempo; a sincronização central pausa os demais, silencia inativos e pausa tudo em `blur` ou quando o documento fica oculto. No Linux, o Electron usa decodificação de vídeo por software para contornar falhas de importação de buffers GBM observadas em alguns drivers, sem desativar a aceleração gráfica usada pelo restante do aplicativo.

### Retorno ao foco

`src/instagram/reel-feed.ts` transforma os arquivos locais em itens discriminados por `type: "normal" | "study"`. As três primeiras posições são normais; a partir da quarta posição, `buildReelFeed` acrescenta pares `normal → study`. O catálogo `STUDY_REELS` contém dados serializáveis e pode receber novos cards educativos sem alterar a navegação.

`ReelsFeed` usa `activeIndex + 1` como posição real exibida. Na posição 3, abre uma única vez o aviso de procrastinação. Na posição 9, abre o modal final, pausa os vídeos e bloqueia teclado, roda do mouse e arraste. Os marcos ficam na memória do processo principal por toda a execução do aplicativo, então fechar e reabrir a janela não reinicia o limite.

O botão **Começar a estudar** chama uma função específica do preload; o processo principal abre uma URL fixa da playlist com `shell.openExternal` e fecha a janela do Instagram após o sucesso. O renderer nunca escolhe nem envia uma URL arbitrária.

O diagnóstico percorre quatro pontos: `ReelsService` registra pasta, caminhos e filtragem; o IPC registra a lista recebida; `ReelsProtocol` registra resolução, Range e status; o renderer registra `loadstart`, metadados, sucesso, reprodução e o `MediaError` completo. Mensagens do renderer com prefixo `[Reels/]` são encaminhadas ao terminal do processo principal.

## Arquivos da distração

Criados: `instagram.html`, `desktop/windows/instagram-window.ts`, `desktop/services/reels-service.ts`, `desktop/services/media-range.ts`, `preload/instagram-preload.ts`, `src/instagram/*`, `public/instagram/home.jpeg`, `assets/reels/README.md` e testes/smoke correspondentes.

Modificados: janela/processo principal, registro de IPC, contratos/eventos compartilhados, preload principal, entrada React/Vite, estilos, README e documentação.

## Fluxo da câmera

```text
gesto explícito do usuário
  → getUserMedia (somente vídeo)
  → ImageBitmap em no máximo 10 fps
  → worker MediaPipe local (preferencial) ou agendador local compatível
  → landmarks efêmeros
  → métricas geométricas
  → calibração + suavização + histerese + tempo mínimo
  → AttentionSignal resumido
  → IPC validado
  → contrato fred:reaction (sem consumidor visual nesta versão)
```

Há no máximo um frame em processamento. Se o detector estiver ocupado, frames novos são ignorados. O processo principal nunca recebe imagens ou landmarks. Nada da câmera é persistido; a calibração também é apenas da sessão.

O backend tenta primeiro um Web Worker. A distribuição 1.0.1 do MediaPipe pode rejeitar a inicialização dentro de um module worker (`ModuleFactory not set`); nesse caso, o controlador faz fallback explícito para o renderer, agenda cada inferência em uma tarefa separada, mantém o limite de 10 fps e continua sem fila. A chamada do SDK é síncrona nesse fallback, portanto o tempo mostrado no diagnóstico deve ser validado na máquina da apresentação.

## Significado dos estados

- `screen`: pose próxima à referência frontal calibrada; significa “provavelmente na direção da tela”, não leitura comprovada.
- `down`: métrica vertical ultrapassou a fração calibrada por tempo suficiente.
- `away`: métrica horizontal saiu da faixa frontal por tempo suficiente.
- `absent`: nenhum rosto utilizável por tempo suficiente.
- `uncertain`: sem calibração, baixa qualidade, transição ou câmera indisponível.

`confidence` é a **qualidade heurística do sinal**, entre 0 e 1, composta por tamanho aparente do rosto (45%), centralidade (35%) e separação geométrica dos olhos (20%). Não é probabilidade científica de atenção, distração ou intenção.

## Temporização inicial

- análise: até 10 fps;
- suavização exponencial: α 0,28;
- qualidade mínima: 0,45;
- `down`: 1,6 s;
- `away`: 1,7 s;
- `absent`: 2,3 s;
- retorno frontal: 0,7 s;
- intervalo entre contratos de reação: 7 s.

Os valores são iniciais e precisam ser ajustados na máquina e iluminação da apresentação.

## Persistência

Somente `mirrored`, `diagnostics` e o identificador preferido do dispositivo são gravados atomicamente em `settings.json` dentro de `app.getPath('userData')`, com `schemaVersion: 1`. Vídeos, imagens, landmarks e histórico de atenção não são salvos.

## Como conectar Fred futuramente

Criar a janela/preload específicos e inscrevê-los no evento `fred:reaction`. O controlador visual deverá traduzir `mood` e `message`; o controlador de posição deverá consumir uma intenção separada. A câmera não deve mover a janela diretamente. Ao criar a janela, ela deverá pedir o estado atual em vez de depender de eventos antigos.
