# Arquitetura

## Escopo presente

A aplicação integra quatro partes no mesmo processo Electron: interface acadêmica, Fred, câmera e ciclo principal. A janela acadêmica é a interface principal; Fred tem uma janela transparente independente; a câmera processa somente vídeo local.

### Domínio acadêmico

- `shared/academy.ts`: contratos, catálogo, validação e transições puras.
- `desktop/services/academy-service.ts`: estado acadêmico persistido com fila serial e gravação atômica.
- `src/app/App.tsx`: planejamento, calendário, progresso, loja e controles integrados de Fred/câmera.
- `src/styles/academy.css`: visual da interface e temas compráveis.
- `preload/main-preload.ts`: ponte restrita para domínio acadêmico, câmera e Fred.

Durante a aula, o iframe continua renderizando o PDF em `public/study/index.html` e `App.tsx` sobrepõe o asset local `public/study/study-reward.mp4` no canto inferior direito. O vídeo começa com 220 px de largura e `aspect-ratio: 16 / 9`; os níveis usam fator 1,25 e são cobrados pela ação `study-video.upgrade`.

Saldo é a soma das transações. IDs determinísticos impedem recompensa ou compra duplicada. Completar uma missão atualiza o estado acadêmico e dispara uma comemoração real do Fred.

### Fred

- `desktop/fred/fred-runtime.ts`: fonte de verdade do estado do mascote.
- `desktop/behavior`: reações, ócio e posicionamento automático.
- `desktop/speech`: síntese local em worker thread.
- `desktop/windows/fred-window.ts`: janela transparente, sem foco e sem barra de tarefas.
- `src/fred/Fred.tsx`: animação, fala, áudio e interação por mouse.

O controlador de ócio agenda scroll em intervalos aleatórios. Ao entrar com o ponteiro durante o scroll, Fred interrompe a animação, pede desculpa e volta ao normal.

### Câmera

```text
getUserMedia (somente vídeo)
  → MediaPipe local, até 10 fps e um frame por vez
  → landmarks efêmeros
  → calibração + suavização + histerese
  → AttentionSignal resumido
  → IPC validado
  → FredRuntime
  → humor + animação + posição + fala
```

Frames e landmarks ficam no renderer da câmera e não são persistidos. O Face Landmarker usa canvas dedicado no renderer porque o contexto gráfico do MediaPipe 1.0.1 não é confiável em module worker neste Electron.

## Processo principal

`desktop/main.ts` inicializa protocolo local, permissões, `AcademyService`, preferências, Fred, interface principal, câmera sob demanda e tray. O lock de instância única protege os arquivos persistidos. Os handlers são registrados antes das janelas carregarem, evitando corridas de IPC.

Os renderers usam `nodeIntegration: false`, `contextIsolation: true` e `sandbox: true`. O protocolo `app://bundle` serve apenas arquivos do build e bloqueia caminhos externos.

## Persistência

- `academy.json`: matérias, missões, provas, transações, itens e perfil.
- `settings.json`: câmera e voz do Fred.
- Vídeo, imagens, landmarks, calibração e histórico de atenção não são gravados.

`studyVideoLevel` é migrado para `0` quando um `academy.json` antigo não possui o campo. Os preços dos quatro níveis são 50, 100, 200 e 400 Study Coins. O MP4 é um asset local; não é convertido em base64 nem enviado a serviços externos.

Wayland nativo pode impedir posicionamento e sobreposição global. X11/XWayland entrega a experiência completa da apresentação.
