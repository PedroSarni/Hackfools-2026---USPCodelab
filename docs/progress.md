# Progresso

Atualizado em: 20 de setembro de 2026.

## Autorização atual

- Criar a estrutura e arquitetura necessárias.
- Implementar as Etapas 2 e 3 do eye tracker.
- Não implementar o esqueleto/Fred por enquanto.
- Instalar ferramentas e dependências necessárias.

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

## Deliberadamente não implementado

- Fred: janela, personagem, fallback, animações, falas visuais e posicionamento.
- Estimativa fina do globo ocular. A versão atual estima orientação da cabeça; a interface não a chama de eye tracking preciso.
- Detecção de celular, punições, moedas ou inferência de procrastinação.
- Etapas 1 e 4–10: feed, PDF, reels, planejamento, missões, loja e descanso.

## Problemas e limites conhecidos

- Ainda é necessário validar webcam, óculos, pouca luz, X11 e Wayland na máquina real.
- O MediaPipe 1.0.1 falhou no module worker deste ambiente (`ModuleFactory not set`); o fallback controlado no renderer precisa ter sua fluidez confirmada na máquina da apresentação.
- Um rosto muito pequeno, parcialmente oculto ou fora do centro reduz a qualidade e pode produzir `uncertain`.
- Olhar apenas com os olhos, sem mover a cabeça, não é classificado de modo confiável.
- Outro monitor pode ser classificado como desvio; a calibração vale para a tela usada.
- O identificador de dispositivo pode mudar após alterações do sistema; nesse caso a câmera padrão é a recuperação manual.
- A licença Apache-2.0 do SDK/repositório está documentada, mas os termos do artefato de modelo devem ser revistos antes de redistribuição pública/comercial.

## Próximo passo sugerido

Somente quando autorizado: implementar a Etapa 1 (Fred flutuante) ou ajustar a Etapa 3 após calibração e observação reais na máquina da apresentação. Não iniciar a Etapa 4 antes disso.
