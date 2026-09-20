# Progresso

Atualizado em 20 de setembro de 2026.

## Entrega integrada

- [x] Interface acadêmica com Hoje, Plano de estudos, Progresso, Loja e perfil.
- [x] Cadastro, edição e exclusão de matérias, missões, provas e entregas.
- [x] Study Coins, histórico, compras idempotentes e temas equipáveis.
- [x] Freddy em uma janela transparente, sempre visível e sem roubar foco.
- [x] Animações do pacote fornecido, estado ocioso scrollando e reação ao ponteiro.
- [x] Voz robótica local em português executada fora da thread principal.
- [x] Câmera em janela própria, seleção de dispositivo e diagnóstico opcional.
- [x] Face Landmarker offline, calibração e classificação de presença, pose para baixo e desvio frontal.
- [x] Eventos da câmera ligados ao estado, posição, animação e fala do Freddy.
- [x] Botão de foco na página Hoje abre a câmera e coloca Freddy em modo de estudo.
- [x] Um único processo principal coordena interface, Freddy, câmera, tray, persistência e IPC.
- [x] Preferências e dados acadêmicos persistidos de forma atômica em `userData`.
- [x] Grade fixa do 2º período de BSI do ICMC/USP, apresentada como sincronização do JúpiterWeb.
- [x] Cinco missões obrigatórias protegidas contra edição e exclusão.
- [x] Aula de Pilhas com 50 slides, scroll controlado, tempo mínimo, checkpoints e roleta de minutos.
- [x] Câmera compacta sempre visível, aberta e ativada automaticamente no início do aplicativo.
- [x] Loja refeita com imagens do Freddy, categorias e nomes de recompensas humorísticos.
- [x] Mini loja de skins abre ao passar o ponteiro sobre Freddy.
- [x] Bônus repetível de 100 Study Coins disponível para demonstração.
- [x] Anúncio clicável dentro da aula abre a roleta, com resultado explícito e efeitos sonoros.
- [x] Vídeo de recompensa da aula fixado no canto inferior direito, pequeno e em proporção 16:9.
- [x] Quatro aumentos proporcionais do vídeo compráveis com Study Coins, persistidos no ledger e refletidos imediatamente na aula.

## Verificação

- TypeScript sem erros nos processos Electron e renderer.
- Build de produção concluído.
- 24 testes automatizados aprovados.
- Origem e argumentos das chamadas IPC validados.
- Carregamento das três janelas pelo protocolo local `app://bundle`.

## Próximas etapas do produto

- Registrar no estado acadêmico o progresso detalhado de cada slide e checkpoint.
- Conectar os itens futuros da loja a novas telinhas e variações de brainrot.
- Sistema de sessões e descanso para o item Intervalo estendido.
- Novos pacotes cosméticos e animações compráveis para Freddy.
- Associar vídeos de recompensa a regras de progresso da aula quando o leitor registrar sessões completas.

## Limites do detector

O detector estima presença e orientação da cabeça. Ele não acompanha com precisão o globo ocular e não identifica um celular diretamente. Pouca luz, óculos, rosto pequeno ou parcialmente oculto podem produzir o estado `uncertain`, e a calibração vale para a câmera e a tela usadas naquela sessão.
