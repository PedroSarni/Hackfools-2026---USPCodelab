# BaiStudy

O BaiStudy atualmente reúne as **Etapas 2 e 3** do documento do produto — câmera, calibração e sinais locais de atenção — e uma distração isolada de Instagram simulado. A aplicação inicia na área de trabalho do **BaiStudy OS**, de onde cada módulo é aberto como um aplicativo. O esqueleto Fred **não foi implementado**; somente o contrato de reação que a futura janela do personagem poderá consumir existe.

## Executar

Pré-requisitos: Node.js 22 ou superior, npm e uma webcam acessível pelo sistema.

```bash
npm install
npm start
```

Durante desenvolvimento:

```bash
npm run dev
```

Na área de trabalho, abra **Foco Total**, autorize o dispositivo e faça a calibração frontal/para baixo. O processamento usa o modelo e o runtime já copiados para `public/models`, sem depender da internet durante a apresentação.

Para testar o Instagram, coloque arquivos `.mp4` ou `.webm` em `assets/reels`, reinicie a janela do Instagram e clique no ícone **Instagram** do desktop. A Home é estática; apenas Home e Reels mudam de aba. O botão **Desktop** no canto superior esquerdo fecha o aplicativo e retorna à área de trabalho.

O catálogo de aplicativos fica em `src/app/desktop-apps.ts`. Aplicativos cuja API segura já existe são adicionados somente com um novo item contendo nome, ícone, descrição, rota e função `launch`. Uma janela totalmente nova também exige, por segurança, seu BrowserWindow, canal IPC e método de preload próprios.

O feed inclui uma mecânica de retorno ao foco: no terceiro item ele avisa sobre o tempo de procrastinação, passa a intercalar cards de estudo e, no nono item, bloqueia o feed e oferece a abertura da playlist de estudos no navegador padrão.

## Verificar

```bash
npm test
npm run typecheck
npm run build
```

Instruções completas e limitações: [docs/testing.md](docs/testing.md). Estado do projeto: [docs/progress.md](docs/progress.md).
