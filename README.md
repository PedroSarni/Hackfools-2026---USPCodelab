# 🎓 FreddyBuddy

> **Transformando procrastinação em produtividade — do jeito mais caótico possível.**

Projeto desenvolvido durante o **Hackfools 2026**, pelo **USP CodeLab**.

O **FreddyBuddy** é uma aplicação desktop experimental que mistura produtividade acadêmica, gamificação e humor para criar uma experiência propositalmente exagerada de combate à procrastinação.

A ideia é simples: se estudar normalmente não está funcionando, talvez um Freddy flutuando pela sua tela, monitorando sua atenção, distribuindo moedas virtuais e transformando uma aula em um feed de Reels resolva.

Ou piore tudo.

Esse é meio que o ponto.

---

## 💡 A ideia

O FreddyBuddy simula uma plataforma acadêmica gamificada na qual o estudante possui:

* 📚 disciplinas e tarefas acadêmicas;
* 🎯 missões obrigatórias;
* 🪙 **Study Coins** como sistema de recompensa;
* 🐻 Freddy, um mascote que acompanha o usuário pela área de trabalho;
* 📷 detecção local de sinais de atenção pela webcam;
* 📱 conteúdos acadêmicos apresentados em formatos inspirados em redes sociais;
* 🎰 recompensas e mecânicas propositalmente absurdas.

A aplicação utiliza como demonstração o **segundo período de Sistemas de Informação do ICMC/USP**.

---

# ✨ Funcionalidades

## 📚 Dashboard acadêmico

A interface principal reúne informações acadêmicas simuladas inspiradas no **JúpiterWeb**, permitindo visualizar disciplinas, atividades e conteúdos do estudante.

As disciplinas obrigatórias aparecem como missões que fazem parte da rotina acadêmica dentro da aplicação.

---

## 🎯 Missões

Atividades acadêmicas são transformadas em **missões**.

Ao concluir uma missão, o estudante recebe **Study Coins**, que podem ser utilizadas dentro do sistema de recompensas.

Algumas obrigações acadêmicas são protegidas pela própria lógica da aplicação e não podem simplesmente ser removidas.

---

## 🪙 Study Coins

Porque aparentemente conhecimento não era recompensa suficiente.

O FreddyBuddy possui uma economia própria baseada em **Study Coins**.

As moedas podem ser obtidas ao concluir atividades e utilizadas para desbloquear recompensas dentro da aplicação, incluindo customizações do Freddy.

---

## 🐻 Freddy

Freddy é o companheiro — ou fiscal — acadêmico do usuário.

Ele permanece como uma janela flutuante sobre os outros aplicativos e reage a diferentes eventos da aplicação.

Entre suas funções estão:

* reagir ao comportamento do usuário;
* aparecer sobre outras janelas;
* oferecer acesso rápido à loja;
* utilizar diferentes skins;
* reagir a períodos de inatividade;
* interagir com eventos relacionados à atenção detectada pela câmera.

---

## 📷 Detecção de atenção

A aplicação utiliza a webcam para estimar localmente alguns sinais relacionados à atenção do usuário.

A detecção é realizada utilizando **MediaPipe**, permitindo identificar situações como ausência do enquadramento ou mudanças na orientação do rosto.

Esses eventos podem gerar reações do Freddy.

> A funcionalidade é experimental e não representa uma medição científica ou médica de atenção.

O processamento necessário para a demonstração é realizado localmente.

---

## 📱 Estudar... mas em formato de Reels

Uma das propostas do projeto é brincar com a maneira como plataformas digitais disputam nossa atenção.

Por isso, conteúdos acadêmicos podem ser apresentados em uma interface vertical inspirada no formato de **Reels**.

Na demonstração, uma aula de **Pilhas** é apresentada em um feed vertical com dezenas de slides.

O usuário precisa permanecer no conteúdo durante determinado período e responder a **checkpoints** antes de continuar avançando.

Ou seja:

> se você consegue passar uma hora scrollando Reels, talvez consiga fazer isso com a matéria da prova também.

---

## 🎰 Roleta de minutos livres

Em determinados momentos da experiência, o usuário pode encontrar recompensas propositalmente questionáveis.

Uma delas é uma **roleta de minutos livres**, utilizada como parte da experiência de gamificação do projeto.

Vitórias e derrotas fazem parte da demonstração.

---

## 🛍️ Loja

Study Coins podem ser utilizadas na loja para adquirir customizações.

Skins compradas podem ser aplicadas imediatamente ao Freddy e permanecem disponíveis dentro da aplicação.

---

# 🛠️ Tecnologias

O projeto foi construído principalmente com:

* **Electron** — aplicação desktop;
* **React** — construção das interfaces;
* **TypeScript** — lógica da aplicação;
* **Vite** — build e ambiente de desenvolvimento;
* **MediaPipe Tasks Vision** — processamento relacionado à câmera;
* **Vitest** — testes automatizados;
* **eSpeak NG / WebAssembly** — recursos de voz.

---

# 🏗️ Estrutura do projeto

```text
.
├── assets/
│   └── reels/          # vídeos utilizados na experiência de Reels
├── desktop/            # processo principal e lógica Electron
├── docs/               # documentação adicional
├── preload/            # comunicação segura Electron ↔ interface
├── public/             # assets públicos e modelos
├── scripts/            # scripts auxiliares
├── shared/             # código compartilhado
├── src/                # aplicação React / renderer
│
├── index.html
├── instagram.html
├── camera.html
├── fred.html
├── package.json
└── README.md
```

---

# 🚀 Como executar

## Pré-requisitos

Antes de começar, tenha instalado:

* **Node.js 22+**
* **npm**
* webcam acessível pelo sistema

Clone o repositório:

```bash
git clone https://github.com/PedroSarni/Hackfools-2026---USPCodelab.git
cd Hackfools-2026---USPCodelab
```

Instale as dependências:

```bash
npm ci
```

Execute:

```bash
npm start
```

---

## 💻 Desenvolvimento

Para executar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

---

## 🐧 Linux / modo de demonstração

Caso o Electron apresente problemas relacionados ao sandbox, X11/XWayland ou aceleração gráfica durante a demonstração:

```bash
npm run start:demo
```

Esse modo aplica as configurações necessárias apenas ao processo utilizado na demonstração.

---

# 🧪 Testes

Execute os testes automatizados:

```bash
npm test
```

Verifique os tipos:

```bash
npm run typecheck
```

Execute o build completo:

```bash
npm run build
```

Os testes cobrem diferentes partes da lógica da aplicação, incluindo regras acadêmicas, persistência, comunicação IPC, calibração, eventos relacionados à atenção e comportamento do Freddy.

---

# 🎮 Roteiro rápido para testar

Depois de iniciar a aplicação:

1. Confira a interface principal, Freddy e a câmera.
2. Abra a seção **Hoje**.
3. Inicie a aula de **Pilhas**.
4. Navegue pelo conteúdo vertical e complete os checkpoints.
5. Explore as missões acadêmicas.
6. Complete uma missão para receber **Study Coins**.
7. Abra a loja e compre uma skin.
8. Interaja com Freddy na área de trabalho.
9. Teste os eventos relacionados à câmera.
10. Explore as demais surpresas espalhadas pela aplicação.

---

# 📁 Assets offline

Os principais recursos necessários para a demonstração são empacotados junto ao projeto, incluindo assets utilizados pelo detector e conteúdos da experiência.

Isso permite que boa parte da demonstração funcione sem depender de serviços externos durante sua execução.

---

# 🏆 Hackfools 2026

Este projeto foi desenvolvido para o **Hackfools 2026**, explorando de maneira satírica a relação entre:

**produtividade + atenção + redes sociais + gamificação + vida universitária.**

A proposta não é criar mais uma plataforma séria de produtividade.

É imaginar o que aconteceria se todas as técnicas utilizadas para prender nossa atenção fossem redirecionadas para fazer um universitário estudar.

---

## 👥 Equipe

Projeto desenvolvido por membros do **USP CodeLab** durante o Hackfools 2026.


- Pedro Sarni — @PedroSarni
- Breno Cad — @brenocad77
- Murilo Ataide — @muriloataide
- Gabriel Maia — @bagiel1


---

## 📚 Documentação

Informações adicionais sobre execução, testes e progresso do projeto estão disponíveis na pasta [`docs/`](./docs).

---

<p align="center">
  <strong>FreddyBuddy</strong><br>
  Talvez estudar não precise ser saudável.
</p>
