# Foco Total

Integração de `feat/interface-fred-integration` (eca86ed) e `Instagram` (fd17cbd), com o desktop do ZIP e os vídeos enviados.

## Executar no Windows

Instale Node.js 22.12+ ou 24 LTS. Evite o Node 25, que não é aceito pelo Vitest usado no projeto. Extraia o ZIP, abra o terminal nesta pasta e execute:

```
npm ci
npm start
```

Nas próximas vezes, você também pode abrir `Iniciar.cmd` depois de compilar.

## Apresentação

1. Clique em Google Chrome. O login é uma simulação local: use dados fictícios. Nenhuma credencial é enviada ou salva.
2. Feche o Chrome no X: Freddy atravessa a tela e abre Foco Total.
3. A câmera liga automaticamente e detecta presença sem calibração. O botão — esconde a prévia sem desligar o detector; o ícone de câmera na barra restaura a janela. X desliga a câmera.
4. Clique no Freddy para abrir a aba de skins. Passe o mouse para reproduzir a prévia; clique para aplicar. O botão de skin padrão remove a seleção.
5. Instagram abre dentro do desktop e mantém os Reels locais da branch Instagram.
6. Abra Pilhas em Foco Total. O Subway Surfers aparece em 16:9 no canto inferior esquerdo; Study Coins aumentam seu tamanho. Use +100 COINS na página inicial para demonstração.
7. O anúncio do cassino aparece após acertar a primeira pergunta e desaparece quando clicado. A roleta usa minutos fictícios, sem dinheiro real.
8. Ao mudar slides, Freddy reproduz a animação de puxar.

## Verificações

`npm run typecheck` e `npm run build` aprovados. `npm test`: 32 testes aprovados.

O teste visual automatizado do Electron foi bloqueado pela restrição de sockets do ambiente. Webcam, áudio e execução visual completa precisam ser conferidos na máquina da apresentação.

A voz é sintetizada localmente em português brasileiro. A câmera requer webcam e permissão do sistema. As limitações físicas de webcam/áudio dependem da máquina de apresentação.

Os vídeos do mascote foram convertidos para WebM VP9 com canal alpha, com remoção do fundo verde, das bordas pretas e enquadramento do personagem.
