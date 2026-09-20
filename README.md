# BaiStudy

Implementação deliberadamente limitada às **Etapas 2 e 3** do documento do produto: janela dedicada de câmera, calibração e estimativa local de sinais de atenção. O esqueleto Fred **não foi implementado**; somente o contrato de reação que a futura janela do personagem poderá consumir existe.

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

Abra a câmera pelo painel mínimo, autorize o dispositivo e faça a calibração frontal/para baixo. O processamento usa o modelo e o runtime já copiados para `public/models`, sem depender da internet durante a apresentação.

## Verificar

```bash
npm test
npm run typecheck
npm run build
```

Instruções completas e limitações: [docs/testing.md](docs/testing.md). Estado do projeto: [docs/progress.md](docs/progress.md).
