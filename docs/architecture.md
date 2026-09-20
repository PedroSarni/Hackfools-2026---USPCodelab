# Arquitetura

## Escopo presente

Esta árvore implementa as etapas 2 e 3. A janela principal é apenas um lançador técnico da câmera. Não há janela, imagem, animação nem posicionamento do Fred; `fred:reaction` é um contrato de integração marcado como `pending-fred`.

```text
desktop/
  main.ts                         ciclo de vida, protocolo local e permissão de vídeo
  windows/                       criação das janelas principal e de câmera
  ipc/                           handlers específicos e validação de origem/dados
  services/settings-service.ts   preferências persistentes da câmera
  behavior/                      converte transições estáveis em reação futura
preload/
  main-preload.ts                abrir câmera e consultar versão
  camera-preload.ts              preferências, fechamento, sinal e reação
shared/
  contracts.ts                   tipos serializáveis entre processos
  events.ts                      canais IPC permitidos
src/
  app/App.tsx                    lançador mínimo, não é a Etapa 4
  camera/CameraView.tsx          interface e coordenação da webcam
  camera/camera-controller.ts    tracks, dispositivos e erros da webcam
  camera/vision-worker.ts        backend preferencial para MediaPipe
  camera/pose-metrics.ts         métricas relativas a partir dos landmarks
  camera/calibration.ts          referências pessoais da sessão
  camera/attention-estimator.ts  suavização, limiares, histerese e permanência
  camera/vision-controller.ts    agenda frames e descarta trabalho atrasado
  styles/                        visual das duas janelas existentes
public/models/                   modelo e runtime WASM locais
docs/                            arquitetura, progresso, teste e licenças
```

Diretórios das etapas futuras não foram criados vazios. Quando uma etapa for autorizada, ela deve acrescentar apenas seus módulos dentro de `src/features`, `desktop/services` ou `desktop/behavior`, conforme a responsabilidade.

## Janelas

- **Principal:** painel técnico mínimo para abrir a câmera. Não antecipa feed, PDF, loja ou planejamento.
- **Câmera:** janela dedicada; o vídeo ocupa a maior área. Fechar ou desligar interrompe todas as tracks.
- **Fred:** inexistente por decisão explícita do escopo atual.

Os renderers mantêm `nodeIntegration: false`, `contextIsolation: true` e `sandbox: true`. Recursos empacotados são servidos pelo protocolo seguro `app://bundle`; em desenvolvimento somente `http://127.0.0.1:5173` é aceito. Navegações e novas janelas são bloqueadas.

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
