# Testes e execução

## Instalação

```bash
npm ci
```

O `postinstall` instala o Electron e copia o runtime WASM para `public/models/wasm`. O modelo `public/models/face_landmarker.task` já faz parte do projeto e não é baixado durante o uso.

## Executar

```bash
npm start
```

Na máquina Linux da apresentação, se o helper SUID do Electron instalado pelo npm não estiver configurado, use:

```bash
npm run start:demo
```

Esse comando aplica `--no-sandbox`, força X11 e libera a aceleração necessária ao MediaPipe somente para essa execução. Para desenvolvimento com recarregamento automático, use `npm run dev`.

## Automatizados

```bash
npm test
npm run typecheck
npm run build
```

São 32 testes que cobrem regras acadêmicas, bônus de demonstração, a grade obrigatória protegida, persistência, validação IPC, calibração, permanência temporal, reações de atenção, comportamento ocioso e posição automática do Freddy.

## Roteiro integrado de apresentação

1. Abra o aplicativo e confirme que interface, Freddy e a câmera compacta aparecem automaticamente.
2. Confira que a câmera inicia sozinha e que seus controles permanecem escondidos no botão de engrenagem.
3. Em **Missões**, confirme as cinco disciplinas do segundo período e tente excluir uma obrigação pela lógica: a operação deve ser recusada.
4. Em **Hoje**, abra Pilhas e confirme os 50 slides, o bloqueio de avanço e o checkpoint do slide 3.
5. Avance ao slide 4, clique no anúncio do Simões e teste vitória e derrota na roleta de minutos livres.
6. Volte à interface, conclua uma missão e confirme o crédito único de 50 Study Coins e a reação de Freddy. Use também **+100 Coins**.
7. Abra a loja, confira imagens e novos nomes, compre e equipe um dos dois temas disponíveis.
8. Saia do enquadramento ou olhe para baixo e confirme a reação de Freddy ao evento da câmera.
9. Passe o ponteiro sobre Freddy, selecione cada skin e confirme a troca imediata. Aguarde o scroll ocioso e confira a fala de desculpa.
10. Use **saída de emergência** ou o menu da bandeja para encerrar todos os processos.
11. Em **Abrir aula**, confirme o vídeo no canto inferior direito, com pausa/som, e que o aumento fica bloqueado sem saldo. Libere moedas pela demo, aumente o vídeo e confirme o crescimento mantendo 16:9; saia e reabra para conferir a persistência.

Os testes automatizados validam a lógica e a comunicação. Webcam física, áudio, posição da sobreposição e qualidade da detecção devem ser conferidos no computador e na sessão gráfica da apresentação.
