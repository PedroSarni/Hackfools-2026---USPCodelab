# Progresso

## Entrega atual — etapas 7 e 8, em 20/09/2026

Autorizado: etapas 7/8 e interface funcional inspirada nos cinco prints. A base tinha somente etapas 2/3; não havia leitor, reels, Fred ou sessões de estudo.

Implementado:

- Hoje, Plano de estudos, Progresso, Loja e perfil; paleta suave, cartões arredondados, resumo diário, gráfico, loja com filtros, prévia e inventário.
- Criar/editar/excluir matérias, missões e provas/entregas. Excluir matéria mantém tarefas/prazos sem vínculo órfão.
- Prazo com horário, prioridade, conteúdo, observações e referências textuais de material/páginas; lista e calendário navegável.
- Provas nos próximos sete dias destacadas, missões relacionadas priorizadas; aviso quando metas de minutos do dia excedem a disponibilidade.
- Missões externas autodeclaradas: 50 moedas uma única vez. Tempo/páginas recusam conclusão sem registros.
- Carteira e histórico persistentes; compras idempotentes; dois temas equipáveis com efeito visual real.
- Gravação atômica serializada em `userData/academy.json`, saldo zero, sem dados fictícios; validação IPC exclusiva da janela principal.
- Câmera preservada. Handlers registrados antes do carregamento da interface, evitando corrida na consulta inicial.

Verificado: typecheck dos dois processos, compilação Electron, build Vite de produção e **17 testes Vitest aprovados**. Serviço compilado testado com conclusões/compras concorrentes e reabertura do arquivo mantendo saldo, histórico, perfil e tema. Prévia no navegador com dados isolados: criação de missões, conclusão, crédito, resgate, débito, equipamento, cadastro de matéria e inspeção visual. A prévia não comprova IPC.

Pendências para conclusão integral das etapas 7/8:

- Etapa 5 ausente: PDFs reais, abertura pela missão, registros de tempo/páginas e progresso verificado.
- Etapa 6 ausente: Passe, Premium e telinhas com vídeos/áudio reais.
- Fred/assets ausentes: reações, roupas e animações alternativas.
- Descanso ausente: efeito de Intervalo estendido. Etapa 9 não iniciada.
- Confirmar abertura nativa pelo `Iniciar.cmd`, IPC, webcam e reinício do Electron nesta máquina. Persistência foi verificada pelo serviço real, não por reinício manual da interface.

Próximo passo: integrar dependências ausentes quando autorizado e concluir os critérios pendentes. Não avançar automaticamente.

## Registro histórico da base recebida — etapas 2/3

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
