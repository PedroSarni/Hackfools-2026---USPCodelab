# Progresso

Atualizado em: 20 de setembro de 2026.

## Autorização atual

- Preservar a aplicação principal, câmera, preloads e IPCs atuais.
- Transformar a janela principal em uma área de trabalho educacional.
- Abrir o Instagram somente por um ícone explícito no desktop.
- Abrir o Instagram simulado em uma janela vertical separada.
- Exibir inicialmente a Home estática baseada na imagem fornecida.
- Implementar somente a aba Reels, usando vídeos locais descobertos em `assets/reels`.
- Não implementar recursos sociais, importador, recompensas ou novas funções de câmera/Fred.

## Concluído

- [x] Projeto Electron + React + TypeScript criado do zero.
- [x] Dependências instaladas e fixadas em `package-lock.json`.
- [x] Janela principal mínima e janela dedicada de câmera.
- [x] Ativar, desativar, selecionar, espelhar e fechar a câmera.
- [x] Tratamento de permissão negada, ausência, ocupação e desconexão.
- [x] Tracks encerradas ao desligar, trocar dispositivo, desmontar ou fechar.
- [x] Face Landmarker 1.0.1 e modelo oficial empacotados para uso offline.
- [x] Backend de Web Worker com fallback compatível no renderer, limitado a 10 fps e sem fila de frames.
- [x] Presença, ausência, pose para baixo e desvio frontal reais por landmarks.
- [x] Calibração frontal, para baixo e lateral opcional, somente na sessão.
- [x] Suavização, qualidade mínima, histerese e permanência mínima.
- [x] Diagnóstico desligável com landmarks, métricas resumidas e estado.
- [x] Persistência atômica das preferências de câmera.
- [x] IPC específico com validação de origem e argumentos.
- [x] Contratos futuros de reação, sem janela ou asset de Fred.
- [x] Testes unitários, typecheck e build de produção.
- [x] Desktop responsivo do BaiStudy OS criado como ponto de entrada da aplicação.
- [x] Catálogo central de aplicativos criado para permitir novos itens sem duplicar a interface.
- [x] Ícones de Foco Total e Instagram adicionados à grade e ao dock.
- [x] Instagram passa a abrir somente após clique explícito no ícone correspondente.
- [x] Botão **Desktop** no Instagram fecha a janela secundária e retorna à área principal.
- [x] Terceira BrowserWindow vertical, frameless, sandboxed e fechável por botão ou `Esc`.
- [x] Home estática construída com `public/instagram/home.jpeg`, cópia da referência fornecida.
- [x] Barra inferior com Home, busca, criar, Reels e perfil; somente Home/Reels alteram a tela.
- [x] Serviço restrito enumera automaticamente `.mp4` e `.webm` de `assets/reels`.
- [x] Streaming local suporta requisições HTTP Range, incluindo intervalos de sufixo usados por MP4.
- [x] Feed vertical com scroll snap, `IntersectionObserver`, autoplay do ativo e pausa dos demais.
- [x] Todos os vídeos inativos ficam pausados e mudos; perda de foco pausa o ativo.
- [x] Arquivos inválidos ou codecs rejeitados saem do feed sem quebrar a janela.
- [x] Estado vazio discreto quando não há mídia reproduzível.
- [x] Smoke test automatizado da janela principal, Home, navegação, Reels e pasta vazia.

## Deliberadamente não implementado

- Fred: janela, personagem, fallback, animações, falas visuais e posicionamento.
- Estimativa fina do globo ocular. A versão atual estima orientação da cabeça; a interface não a chama de eye tracking preciso.
- Detecção de celular, punições, moedas ou inferência de procrastinação.
- Etapas 1 e 4–5 e 7–10: feed principal, PDF, planejamento, missões, loja e descanso.
- A distração implementada não inclui desbloqueio por estudo nem a biblioteca/importador completo da Etapa 6.

## Problemas e limites conhecidos

- Ainda é necessário validar webcam, óculos, pouca luz, X11 e Wayland na máquina real.
- O MediaPipe 1.0.1 falhou no module worker deste ambiente (`ModuleFactory not set`); o fallback controlado no renderer precisa ter sua fluidez confirmada na máquina da apresentação.
- Um rosto muito pequeno, parcialmente oculto ou fora do centro reduz a qualidade e pode produzir `uncertain`.
- Olhar apenas com os olhos, sem mover a cabeça, não é classificado de modo confiável.
- Outro monitor pode ser classificado como desvio; a calibração vale para a tela usada.
- O identificador de dispositivo pode mudar após alterações do sistema; nesse caso a câmera padrão é a recuperação manual.
- A licença Apache-2.0 do SDK/repositório está documentada, mas os termos do artefato de modelo devem ser revistos antes de redistribuição pública/comercial.
- `.mp4` e `.webm` são enumerados. WebM VP8/Opus foi reproduzido no teste real. MP4 H.264/AAC declarou suporte no Chromium, mas causou reinício do processo GPU neste ambiente X11 virtual; deve ser confirmado na máquina da apresentação.
- A pasta é relida quando a janela abre. Depois de adicionar vídeos com a janela aberta, feche e reabra o Instagram.

## Próximo passo sugerido

Somente quando autorizado: validar os MP4 reais da equipe na máquina da apresentação ou avançar outra etapa do produto. Não implementar recursos sociais nem gerenciamento de vídeos antecipadamente.
