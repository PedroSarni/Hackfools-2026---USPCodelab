# Testes e execução

## Validação desta entrega (etapas 7/8)

- Typecheck renderer/Electron: aprovado. Compilação Electron: aprovada.
- 17 testes em 6 arquivos: aprovados, incluindo câmera preexistente e novas regras/persistência.
- Serviço compilado: aprovada reabertura de arquivo temporário com saldo, compras, tema e perfil, além de operações concorrentes sem duplicação.
- Build renderer: aprovado via API do Vite com `configFile: false`, `preserveSymlinks: true` e alias para scheduler do React. Neste ambiente, CLI padrão do Vite falha na descoberta de drives do Windows (`spawn EPERM`); o caminho programático evita essa consulta desnecessária. Vitest executado via API, pool threads e resolução preservando symlinks. Nenhum sandbox foi desativado.
- Prévia isolada no navegador: criar duas missões, concluir, receber 100 moedas, resgatar Lavanda, saldo zero, equipar tema; cadastrar matéria e prova e confirmar a prova no calendário. Layout conferido em largura estreita e desktop.
- Não verificado nesta entrega: webcam física, sessão nativa Electron/IPC e reinício manual das janelas. Não declarar essas validações como concluídas.

### Roteiro manual acadêmico

1. Execute `npm ci` e `npm start`; na cópia local com build preparado, `Iniciar.cmd` abre diretamente.
2. Cadastre matéria, missão e prova com material/páginas como referência. Confira edição, calendário e prioridade de prova próxima.
3. Declare duas missões externas concluídas; saldo deve ser 100. Cliques repetidos não somam moedas.
4. Missão de 20 minutos sem registros deve recusar conclusão. O acesso ao planejamento continua livre.
5. Compre Lavanda, equipe, veja a mudança e desative. Tente comprar Maré sem saldo: deve falhar.
6. Reabra e confira registros/tema/histórico. Exclua matéria: missões continuam sem matéria, histórico permanece.
7. Abra câmera pelo rodapé e confira os fluxos anteriores. Itens de mídia/Fred/descanso continuam indisponíveis até suas dependências.

### Instruções anteriores da câmera

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

## Verificado neste ambiente

- Node.js 24.18.0 e npm 11.16.0.
- Instalação limpa: 130 pacotes auditados, 0 vulnerabilidades relatadas pelo npm.
- 10 testes automatizados aprovados.
- TypeScript sem erros.
- Build Electron/Vite concluído.
- Janelas principal e de câmera carregadas via `app://bundle`; preloads sandboxed e APIs específicas confirmados.
- O SDK acionou o fallback documentado do worker para o renderer neste ambiente.
- SHA-256 do modelo: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`.

## Ainda depende da máquina do usuário

- Permissão real do sistema para webcam.
- Imagem, seleção de múltiplas câmeras e liberação do LED/tracks.
- Qualidade da classificação com o rosto, óculos, luz e postura do apresentador.
- Comportamento visual em X11 e Wayland.
- Desempenho sustentado no computador da apresentação.
