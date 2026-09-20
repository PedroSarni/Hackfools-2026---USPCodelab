# FreddyBuddy

Aplicativo Electron de hiperestímulo acadêmico que reúne grade simulada do JúpiterWeb, missões obrigatórias, Freddy flutuante e câmera com estimativa local de atenção. A demonstração usa o segundo período de BSI do ICMC/USP, aula de Pilhas em formato de reels, checkpoints, roleta de minutos livres, Study Coins e uma loja de recompensas absurdas.

## Executar

Pré-requisitos: Node.js 22 ou superior, npm e uma webcam acessível pelo sistema.

```bash
npm ci
npm start
```

No Linux, se o Electron rejeitar o helper de sandbox ou a apresentação precisar de X11/XWayland e WebGL liberado:

```bash
npm run start:demo
```

Esse modo não altera permissões do sistema. Ele aplica `--no-sandbox`, X11 e `--ignore-gpu-blocklist` somente ao processo da demonstração.

Durante o desenvolvimento:

```bash
npm run dev
```

No Windows, depois de preparar as dependências e executar o build, também é possível abrir `Iniciar.cmd`.

## Experimentar

1. Ao abrir, a câmera compacta inicia automaticamente no canto e Freddy aparece sobre os outros aplicativos.
2. Em **Hoje**, use **Começar Pilhas agora** para abrir o PDF em um feed vertical com 50 slides.
3. Permaneça em cada slide pelo tempo exigido e responda aos checkpoints para liberar o próximo.
4. Depois do primeiro checkpoint, avance ao quarto slide, clique no anúncio **Aposte aqui** e teste vitória e derrota na roleta.
5. Em **Missões**, confira as cinco disciplinas obrigatórias importadas e marque uma entrega para ganhar 50 Study Coins.
6. Use **+100 Coins** quantas vezes precisar, compre uma skin e confirme que ela é aplicada imediatamente.
7. Passe o ponteiro sobre Freddy para abrir a loja rápida de skins.
8. Feche e reabra a câmera pelo `×` e pelo botão do cabeçalho.
9. Use o tray ou **saída de emergência** para encerrar Freddy, câmera e interface.

## Verificar

```bash
npm test
npm run typecheck
npm run build
```

O PDF, o vídeo do cassino, PDF.js e os assets do detector são empacotados para a demonstração funcionar offline. Instruções completas: [docs/testing.md](docs/testing.md). Estado do projeto: [docs/progress.md](docs/progress.md).
