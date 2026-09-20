# Testes e execução

## Instalação

```bash
npm install
```

O `postinstall` instala o binário do Electron e copia o runtime WASM para `public/models/wasm`. O modelo `public/models/face_landmarker.task` faz parte da árvore do projeto e não é baixado em runtime.

## Executar

Produção local:

```bash
npm start
```

Desenvolvimento:

```bash
npm run dev
```

Linux/X11 explícito:

```bash
npm start -- --ozone-platform=x11
```

Linux/Wayland explícito:

```bash
npm start -- --ozone-platform=wayland
```

O projeto não injeta `--no-sandbox`, não altera `chrome-sandbox` e não ignora opções gráficas passadas pelo usuário.

## Automatizados

```bash
npm test
npm run typecheck
npm run build
```

Os testes cobrem calibração, permanência temporal, indisponibilidade, validação IPC e deduplicação básica de reações. Eles não comprovam que uma janela ou webcam física apareceu.

O smoke test do Instagram abre o Electron, inspeciona as duas janelas pelo protocolo de depuração local e encerra o processo automaticamente:

```bash
node scripts/smoke-instagram.mjs
```

## Roteiro manual — Etapa 2

1. Rode o aplicativo e clique em **Abrir câmera**.
2. Confirme que a janela contém somente vídeo, controles e sobreposições discretas.
3. Clique em **Ativar câmera** e aceite a permissão.
4. Se houver mais de uma câmera, alterne o dispositivo.
5. Ative/desative **Espelhar prévia** e confirme a orientação.
6. Clique em **Desativar câmera** e confira que o indicador muda imediatamente.
7. Reative e feche a janela; confira no indicador do sistema que a câmera foi liberada.
8. Repita negando permissão, com câmera ocupada e desconectando o dispositivo quando possível.

## Roteiro manual — Etapa 3

1. Ative a câmera e aguarde **Carregando detector local** desaparecer.
2. Inicie a calibração mantendo webcam e tela fixas.
3. Capture a referência frontal olhando normalmente para a tela.
4. Capture a referência inclinando a cabeça para baixo.
5. Capture uma lateral ou use **Pular lateral**.
6. Fique frontal e aguarde o estado estável `Provavelmente olhando para a tela`.
7. Abaixe a cabeça por cerca de 2 segundos e confira `Cabeça inclinada para baixo`.
8. Vire para o lado por cerca de 2 segundos e confira `Fora da direção frontal`.
9. Saia do enquadramento por cerca de 3 segundos e confira `Rosto não detectado`.
10. Retorne e confirme que não há alternância rápida nem falas repetidas.
11. Desligue **Diagnóstico** e confirme que vídeo/estado continuam, sem landmarks.
12. Teste pouca luz, óculos e sinal instável. Nesses casos, `Detecção incerta` é preferível a acusação.

O aviso “evento para Fred” demonstra apenas o contrato que a futura janela consumirá. Não é uma implementação do esqueleto.

## Roteiro manual — Instagram e Reels

1. Coloque dois ou mais vídeos em `assets/reels` e execute `npm start`.
2. Confirme que a primeira tela é a área de trabalho do BaiStudy OS e que nenhuma janela do Instagram abriu automaticamente.
3. Clique uma vez no ícone **Instagram** e confira a janela estreita/vertical.
4. Confirme que a Home estática da referência é a tela inicial.
5. Clique nos ícones visuais de busca/criar/perfil; eles não devem abrir páginas.
6. Clique em Reels; a troca deve ocorrer na mesma janela.
7. Use ↑/↓ e arraste para baixo/cima com o mouse; cada item deve encaixar na tela.
8. Confirme que somente o vídeo visível reproduz e que o anterior pausa.
9. Ative o áudio no botão lateral e confirme que não há dois áudios simultâneos.
10. Mude o foco para outra janela; o vídeo deve pausar.
11. Clique em **Desktop** no canto superior esquerdo e confira que o Instagram fecha e a área de trabalho continua aberta.
12. Remova os vídeos, reabra o Instagram e confirme o estado vazio.
13. Adicione `.txt`, `.mov` ou subpasta e confirme que são ignorados.
14. Ao chegar à posição 3, confirme o modal e que as setas não mudam o item enquanto ele está aberto.
15. Clique em **Continuar** e confirme a sequência `normal → estudo → normal → estudo`.
16. Ao chegar à posição 9, confirme o modal final e que setas, roda e arraste não avançam o feed.
17. Clique em **Começar a estudar** e confirme que a janela do Instagram fecha e a playlist abre no navegador padrão.

## Verificado neste ambiente

- Node.js 24.18.0 e npm 11.16.0.
- Instalação limpa: 130 pacotes auditados, 0 vulnerabilidades relatadas pelo npm.
- 16 testes automatizados aprovados em 6 arquivos.
- TypeScript sem erros.
- Build Electron/Vite concluído.
- Janelas principal e de câmera carregadas via `app://bundle`; preloads sandboxed e APIs específicas confirmados.
- O SDK acionou o fallback documentado do worker para o renderer neste ambiente.
- SHA-256 do modelo: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.
- Smoke test confirmou botão principal, ponte/janela de câmera ainda disponíveis e inicialmente inativas, janela vertical do Instagram, Home carregada, cinco posições da navegação e troca para Reels.
- Smoke test confirmou o desktop como única janela inicial, abertura do Instagram pelo ícone e retorno à área de trabalho pelo botão dedicado.
- Os seis Reels locais foram enumerados e servidos com `206`, MIME correto e caminhos absolutos/relativos esperados.
- Reels 1–3 inicialmente produziram `MEDIA_ERR_DECODE` junto com queda do processo GPU por falha de buffer GBM. Com `disable-accelerated-video-decode`, Reels 1–5 chegaram a `readyState=4`, dimensões válidas, reprodução ativa e `error=null`.
- O Reel 6 original usava HEVC e carregava com dimensão `0 × 0`; ele foi normalizado para H.264/AAC-LC, preservando a fonte em `assets/reels/sources`.
- O smoke test percorreu o feed pelas setas, confirmou os tipos `normal/study`, o aviso único no item 3, o bloqueio `3 → 3`, o limite no item 9 e o bloqueio `9 → 9`.

## Ainda depende da máquina do usuário

- Permissão real do sistema para webcam.
- Imagem, seleção de múltiplas câmeras e liberação do LED/tracks.
- Qualidade da classificação com o rosto, óculos, luz e postura do apresentador.
- Comportamento visual em X11 e Wayland.
- Desempenho sustentado no computador da apresentação.
- Desempenho de decodificação por software para vídeos H.264 grandes ou com taxa de quadros alta.
- Fidelidade final da janela em escala de tela diferente. A captura local confirmou 426 × 856 pixels de conteúdo; o sistema reportou 458 × 898 unidades externas por causa da escala do display.
