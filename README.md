# BaiStudy

Aplicativo Electron com interface inspirada nos prints: Hoje, planejamento, calendário, progresso, carteira e loja. A câmera e a calibração das etapas 2 e 3 foram preservadas. As etapas 7 e 8 têm planejamento, missões externas, carteira e temas funcionais; sua conclusão integral depende do leitor, dos vídeos e do Fred, ausentes na base recebida. Esses recursos aparecem como indisponíveis.

## Executar

Pré-requisitos: Node.js 22 ou superior, npm e uma webcam acessível pelo sistema.

```bash
npm ci
npm start
```

Durante desenvolvimento:

```bash
npm run dev
```

Na cópia local entregue, dependências e build estão preparados: abra `Iniciar.cmd` no Windows. Após alterar o código, execute `npm run build` antes de usar esse atalho.

Abra a câmera pelo painel Hoje ou rodapé, autorize o dispositivo e faça a calibração frontal/para baixo. O processamento usa o modelo e o runtime locais.

## Experimentar

1. Em Plano de estudos, crie uma matéria e uma prova; alterne lista/calendário.
2. Crie duas missões com critério Autodeclaração e conclua-as: cada uma concede 50 moedas, uma única vez.
3. Resgate Jardim de lavanda por 100 moedas e clique em Equipar. O tema muda imediatamente; Desativar restaura o padrão.
4. Veja o histórico em Progresso. Feche e reabra: dados e tema são persistentes.
5. Missões de tempo/páginas devem recusar conclusão sem registros, e itens indisponíveis não podem ser comprados.

Primeiro acesso vazio, saldo zero, sem dinheiro real. Referências de PDF são anotações textuais até a etapa 5. Nenhum personagem ou asset do Fred foi inventado.

## Verificar

```bash
npm test
npm run typecheck
npm run build
```

Instruções completas e limitações: [docs/testing.md](docs/testing.md). Estado do projeto: [docs/progress.md](docs/progress.md).
