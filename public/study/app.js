/*
  Aula em formato Reels
  - Cada slide precisa ficar ATIVO por pelo menos 20 segundos.
  - O tempo pausa quando a aba deixa de estar visível.
  - Slides importantes abrem um checkpoint depois dos 20s.
  - O próximo slide só é liberado depois da resposta correta.
*/

const PDF_URL = "aula-pilhas.pdf";
const MIN_SECONDS_PER_SLIDE = 8;

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

// Chave = número do slide no PDF (começa em 1).
// Perguntas baseadas no conteúdo da própria aula.
const QUIZZES = {
  3: {
    question: "Qual princípio define o funcionamento de uma pilha?",
    options: ["FIFO", "LIFO", "Acesso aleatório", "Prioridade"],
    correct: 1,
  },
  5: {
    question: "Qual operação retorna o elemento do topo sem removê-lo?",
    options: ["push", "pop", "top / peek", "free_stack"],
    correct: 2,
  },
  6: {
    question: "Qual é a saída das chamadas mostradas neste slide?",
    options: [
      "5, 8, 8, 8, 50, 10",
      "5, 8, 9, 10, 50, 8",
      "5, 8, 8, 50, 10, 9",
      "8, 5, 8, 8, 10, 50",
    ],
    correct: 0,
  },
  9: {
    question: "Qual estrutura armazena informações das funções ativas durante a execução de um programa?",
    options: ["Heap", "Call stack", "Fila de prioridade", "Hash table"],
    correct: 1,
  },
  12: {
    question: "Qual é a principal vantagem do TAD Pilha apresentada na aula?",
    options: [
      "Eliminar a necessidade de memória dinâmica",
      "Abstrair a implementação por trás de uma interface",
      "Fazer toda pilha ter tamanho fixo",
      "Permitir acessar qualquer posição diretamente",
    ],
    correct: 1,
  },
  14: {
    question: "Em um tipo opaco em C, onde a definição completa da struct deve ficar?",
    options: ["No arquivo .c", "No arquivo .h", "No Makefile", "Dentro da main"],
    correct: 0,
  },
  16: {
    question: "Segundo as convenções de retorno mostradas no slide, qual valor indica erro?",
    options: ["-1", "0", "1", "Qualquer valor > 1"],
    correct: 0,
  },
  18: {
    question: "Nesta implementação da aula, como os elementos da pilha são armazenados?",
    options: [
      "Em uma árvore binária",
      "Em um vetor estático de tamanho fixo",
      "Em uma fila circular",
      "Somente em memória dinâmica com nós",
    ],
    correct: 1,
  },
  22: {
    question: "Qual condição indica que a pilha está vazia nesta implementação?",
    options: ["s->qtd == 0", "s->qtd == 1", "s->qtd == MAX", "s->dados[0] == 0"],
    correct: 0,
  },
  25: {
    question: "Qual condição indica que a pilha está cheia nesta implementação?",
    options: ["s->qtd == 0", "s->qtd == MAX", "s->qtd > MAX", "s->dados[MAX] == 0"],
    correct: 1,
  },
  33: {
    question: "Se qtd já é igual a MAX, o que deve acontecer ao tentar fazer outro push?",
    options: [
      "Sobrescrever automaticamente o topo",
      "Inserir depois do vetor",
      "Não inserir um novo elemento",
      "Remover o primeiro elemento e inserir",
    ],
    correct: 2,
  },
  37: {
    question: "Depois de um pop, é necessário apagar fisicamente o valor antigo do vetor?",
    options: [
      "Sim, sempre",
      "Não; qtd delimita quais posições ainda são válidas",
      "Somente se o valor for negativo",
      "Somente quando a pilha fica vazia",
    ],
    correct: 1,
  },
  41: {
    question: "Em qual posição está o topo de uma pilha com qtd elementos?",
    options: ["dados[0]", "dados[qtd]", "dados[qtd - 1]", "dados[MAX - qtd]"],
    correct: 2,
  },
  43: {
    question: "Qual arquivo o main.c importa para utilizar a interface do TAD Pilha?",
    options: ["Stack.h", "Stack.c", "Makefile", "stdlib.c"],
    correct: 0,
  },
  45: {
    question: "Na estratégia de conversão decimal para binário, o que é empilhado a cada divisão por 2?",
    options: ["O quociente", "O divisor", "O resto", "O número original"],
    correct: 2,
  },
  46: {
    question: "Na calculadora polonesa, o que deve ser feito ao encontrar um operador?",
    options: [
      "Empilhar o operador e ignorar os números",
      "Fazer pop de dois valores, aplicar a operação e fazer push do resultado",
      "Esvaziar toda a pilha",
      "Aplicar o operador somente ao topo, sem pop",
    ],
    correct: 1,
  },
};

const feed = document.getElementById("feed");
const slideCounter = document.getElementById("slideCounter");
const timerBadge = document.getElementById("timerBadge");
const gateStatus = document.getElementById("gateStatus");
const gateProgress = document.getElementById("gateProgress");
const gateText = document.getElementById("gateText");
const swipeHint = document.getElementById("swipeHint");
const quizModal = document.getElementById("quizModal");
const quizQuestion = document.getElementById("quizQuestion");
const quizOptions = document.getElementById("quizOptions");
const quizFeedback = document.getElementById("quizFeedback");
const loading = document.getElementById("loading");

let pdf = null;
let totalSlides = 0;
let currentIndex = 0; // zero-based
let isAnimating = false;
let touchStartY = null;
let lastWheelAt = 0;
let timerHandle = null;
let lastTick = performance.now();

// Cada slide acumula apenas tempo em que esteve realmente ativo e a aba estava visível.
const state = [];

function createSlideState() {
  return {
    remainingMs: MIN_SECONDS_PER_SLIDE * 1000,
    timeSatisfied: false,
    quizPassed: false,
    quizShown: false,
    rendered: false,
    rendering: false,
  };
}

function getCurrentState() {
  return state[currentIndex];
}

function slideNumber() {
  return currentIndex + 1;
}

function hasQuiz(index = currentIndex) {
  return Boolean(QUIZZES[index + 1]);
}

function canGoForward() {
  const s = getCurrentState();
  if (!s) return false;
  return s.timeSatisfied && (!hasQuiz() || s.quizPassed);
}

async function init() {
  try {
    pdf = await pdfjsLib.getDocument(PDF_URL).promise;
    totalSlides = pdf.numPages;

    for (let i = 0; i < totalSlides; i++) {
      state.push(createSlideState());
      const slide = document.createElement("section");
      slide.className = "slide";
      slide.dataset.index = String(i);
      slide.innerHTML = `
        <div class="slide__canvasWrap">
          <div class="slide__placeholder" aria-label="Carregando slide ${i + 1}"></div>
        </div>
      `;
      feed.appendChild(slide);
    }

    await renderAround(0);
    updateHUD();
    startActiveTimer();
    loading.classList.add("is-hidden");
  } catch (error) {
    console.error(error);
    loading.innerHTML = `
      <strong>Não foi possível abrir o PDF.</strong>
      <span>Abra esta pasta usando um servidor local (veja o README).</span>
    `;
  }
}

async function renderAround(index) {
  const targets = [index - 1, index, index + 1, index + 2]
    .filter(i => i >= 0 && i < totalSlides);
  await Promise.all(targets.map(renderSlide));
}

async function renderSlide(index) {
  const s = state[index];
  if (!s || s.rendered || s.rendering) return;
  s.rendering = true;

  try {
    const page = await pdf.getPage(index + 1);
    const baseViewport = page.getViewport({ scale: 1 });

    // Renderiza com resolução suficiente para ficar nítido em telas HiDPI.
    const maxWidth = Math.min(window.innerWidth * 0.96, 1320);
    const maxHeight = Math.max(300, window.innerHeight - 150);
    const cssScale = Math.min(maxWidth / baseViewport.width, maxHeight / baseViewport.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderScale = Math.max(1, cssScale * dpr);
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.setAttribute("aria-label", `Slide ${index + 1}`);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const wrap = feed.children[index].querySelector(".slide__canvasWrap");
    wrap.replaceChildren(canvas);
    s.rendered = true;
  } catch (error) {
    console.error(`Erro ao renderizar slide ${index + 1}:`, error);
  } finally {
    s.rendering = false;
  }
}

function startActiveTimer() {
  stopActiveTimer();
  lastTick = performance.now();

  timerHandle = window.setInterval(() => {
    const now = performance.now();
    const elapsed = now - lastTick;
    lastTick = now;

    const s = getCurrentState();
    if (!s || s.timeSatisfied || document.hidden || quizModal.classList.contains("is-open") || casinoModal.classList.contains("is-open")) {
      updateHUD();
      return;
    }

    s.remainingMs = Math.max(0, s.remainingMs - elapsed);

    if (s.remainingMs <= 0) {
      s.timeSatisfied = true;
      if (hasQuiz() && !s.quizPassed) {
        openQuiz();
      }
    }

    updateHUD();
  }, 200);
}

function stopActiveTimer() {
  if (timerHandle) window.clearInterval(timerHandle);
  timerHandle = null;
}

function updateHUD() {
  const s = getCurrentState();
  if (!s) return;

  slideCounter.textContent = `Slide ${slideNumber()} / ${totalSlides}`;
  timerBadge.classList.remove("is-ready", "is-quiz");
  gateStatus.classList.remove("is-ready", "is-quiz");
  swipeHint.classList.remove("is-visible");

  const elapsed = MIN_SECONDS_PER_SLIDE * 1000 - s.remainingMs;
  const percent = Math.min(100, Math.max(0, (elapsed / (MIN_SECONDS_PER_SLIDE * 1000)) * 100));
  gateProgress.style.width = `${percent}%`;

  if (!s.timeSatisfied) {
    const seconds = Math.max(1, Math.ceil(s.remainingMs / 1000));
    timerBadge.textContent = `${seconds}s`;
    gateText.textContent = `Fique neste slide por mais ${seconds}s para liberar o avanço.`;
    return;
  }

  if (hasQuiz() && !s.quizPassed) {
    timerBadge.textContent = "QUIZ";
    timerBadge.classList.add("is-quiz");
    gateStatus.classList.add("is-quiz");
    gateProgress.style.width = "100%";
    gateText.textContent = "Responda corretamente ao checkpoint para liberar o próximo slide.";
    return;
  }

  timerBadge.textContent = slideNumber() === totalSlides ? "FIM" : "OK";
  timerBadge.classList.add("is-ready");
  gateStatus.classList.add("is-ready");
  gateProgress.style.width = "100%";
  gateText.textContent = slideNumber() === totalSlides
    ? "Você chegou ao fim da aula."
    : "Liberado. Role para cima para continuar.";
  if (slideNumber() !== totalSlides) swipeHint.classList.add("is-visible");
}

function openQuiz() {
  const s = getCurrentState();
  const quiz = QUIZZES[slideNumber()];
  if (!quiz || s.quizPassed || !s.timeSatisfied) return;

  s.quizShown = true;
  quizQuestion.textContent = quiz.question;
  quizFeedback.textContent = "";
  quizFeedback.className = "flashcard__feedback";
  quizOptions.replaceChildren();

  quiz.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flashcard__option";
    button.textContent = option;
    button.addEventListener("click", () => answerQuiz(button, index));
    quizOptions.appendChild(button);
  });

  quizModal.classList.add("is-open");
  quizModal.setAttribute("aria-hidden", "false");
  updateHUD();
}

function answerQuiz(button, selectedIndex) {
  const s = getCurrentState();
  const quiz = QUIZZES[slideNumber()];
  if (!quiz || s.quizPassed) return;

  if (selectedIndex !== quiz.correct) {
    button.classList.add("is-wrong");
    quizFeedback.textContent = "Ainda não. Tente outra alternativa.";
    quizFeedback.className = "flashcard__feedback bad";
    window.setTimeout(() => button.classList.remove("is-wrong"), 500);
    return;
  }

  s.quizPassed = true;
  if (slideNumber() === 3) firstQuizPassed = true;
  button.classList.add("is-correct");
  [...quizOptions.children].forEach(el => { el.disabled = true; });
  quizFeedback.textContent = "Correto. Próximo slide liberado.";
  quizFeedback.className = "flashcard__feedback ok";
  updateHUD();

  window.setTimeout(() => { closeQuiz(); updateCasinoTeaser(); }, 700);
}

function closeQuiz() {
  quizModal.classList.remove("is-open");
  quizModal.setAttribute("aria-hidden", "true");
  updateHUD();
}

async function goToSlide(nextIndex) {
  if (isAnimating || nextIndex < 0 || nextIndex >= totalSlides || nextIndex === currentIndex) return;

  if (nextIndex > currentIndex && !canGoForward()) {
    if (getCurrentState().timeSatisfied && hasQuiz() && !getCurrentState().quizPassed) {
      openQuiz();
    }
    pulseGate();
    return;
  }

  // Voltar é sempre permitido. Avançar depende do gate do slide atual.
  isAnimating = true;
  currentIndex = nextIndex;
  await renderAround(currentIndex);

  feed.scrollTo({ top: currentIndex * window.innerHeight, behavior: "smooth" });
  updateHUD();
  startActiveTimer();
  updateCasinoTeaser();

  window.setTimeout(() => { isAnimating = false; }, 520);
}

function pulseGate() {
  gateStatus.animate(
    [
      { transform: "translateX(-50%) scale(1)" },
      { transform: "translateX(-50%) scale(1.025)" },
      { transform: "translateX(-50%) scale(1)" },
    ],
    { duration: 260, easing: "ease-out" }
  );
}

window.addEventListener("wheel", event => {
  event.preventDefault();
  if (quizModal.classList.contains("is-open") || casinoModal.classList.contains("is-open")) return;

  const now = performance.now();
  if (now - lastWheelAt < 420 || Math.abs(event.deltaY) < 8) return;
  lastWheelAt = now;

  if (event.deltaY > 0) goToSlide(currentIndex + 1);
  else goToSlide(currentIndex - 1);
}, { passive: false });

window.addEventListener("keydown", event => {
  if (quizModal.classList.contains("is-open") || casinoModal.classList.contains("is-open")) return;

  const forwardKeys = ["ArrowDown", "PageDown", " "];
  const backKeys = ["ArrowUp", "PageUp"];

  if (forwardKeys.includes(event.key)) {
    event.preventDefault();
    goToSlide(currentIndex + 1);
  } else if (backKeys.includes(event.key)) {
    event.preventDefault();
    goToSlide(currentIndex - 1);
  }
});

window.addEventListener("touchstart", event => {
  if (quizModal.classList.contains("is-open") || casinoModal.classList.contains("is-open")) return;
  touchStartY = event.changedTouches[0].clientY;
}, { passive: true });

window.addEventListener("touchmove", event => {
  // Impede o scroll nativo; a troca de slide é controlada no touchend.
  if (!quizModal.classList.contains("is-open") && !casinoModal.classList.contains("is-open")) event.preventDefault();
}, { passive: false });

window.addEventListener("touchend", event => {
  if (touchStartY === null || quizModal.classList.contains("is-open") || casinoModal.classList.contains("is-open")) return;
  const endY = event.changedTouches[0].clientY;
  const delta = touchStartY - endY;
  touchStartY = null;

  if (Math.abs(delta) < 45) return;
  if (delta > 0) goToSlide(currentIndex + 1);
  else goToSlide(currentIndex - 1);
}, { passive: true });

window.addEventListener("resize", () => {
  // Mantém o slide atual alinhado após mudança de tamanho da janela.
  feed.scrollTo({ top: currentIndex * window.innerHeight, behavior: "auto" });
});

document.addEventListener("visibilitychange", () => {
  // Evita que 20s contem enquanto a pessoa está em outra aba.
  lastTick = performance.now();
});

init();

// ---------------- ROLETA DE MINUTOS LIVRES ----------------
// O saldo reinicia em 50 minutos a cada novo dia local.
// Apostar N minutos dá chance (51 - N)% de vitória.
// Vitória: a aposta dobra (saldo líquido +N). Derrota: perde N.
const DAILY_FREE_MINUTES = 50;
const CASINO_TRIGGER_SLIDE = 4; // anúncio aparece depois do primeiro checkpoint

const casinoModal = document.getElementById("casinoModal");
const casinoClose = document.getElementById("casinoClose");
const casinoTeaser = document.getElementById("casinoTeaser");
const casinoVideo = document.getElementById("casinoVideo");
const freeMinutesEl = document.getElementById("freeMinutes");
const betRange = document.getElementById("betRange");
const betAmount = document.getElementById("betAmount");
const chanceText = document.getElementById("chanceText");
const chanceMeter = document.getElementById("chanceMeter");
const rouletteChance = document.getElementById("rouletteChance");
const roulette = document.getElementById("roulette");
const spinButton = document.getElementById("spinButton");
const casinoResult = document.getElementById("casinoResult");

let firstQuizPassed = false;
let casinoTeaserDismissed = false;
let casinoSpinning = false;
let rouletteRotation = 0;

function localDateKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadMinuteWallet() {
  const today = localDateKey();
  let wallet = null;
  try {
    wallet = JSON.parse(localStorage.getItem("studyFreeMinutesWallet") || "null");
  } catch (_) {}

  if (!wallet || wallet.date !== today || !Number.isFinite(wallet.balance)) {
    wallet = { date: today, balance: DAILY_FREE_MINUTES };
    localStorage.setItem("studyFreeMinutesWallet", JSON.stringify(wallet));
  }

  return wallet;
}

function saveMinuteWallet(wallet) {
  localStorage.setItem("studyFreeMinutesWallet", JSON.stringify(wallet));
}

function getFreeMinutes() {
  return Math.max(0, Math.floor(loadMinuteWallet().balance));
}

function setFreeMinutes(value) {
  const wallet = loadMinuteWallet();
  wallet.balance = Math.max(0, Math.floor(value));
  saveMinuteWallet(wallet);
  refreshCasinoUI();
}

function chanceForBet(bet) {
  return Math.max(1, Math.min(50, 51 - bet));
}

function refreshCasinoUI() {
  const balance = getFreeMinutes();
  freeMinutesEl.textContent = balance;

  const maxBet = Math.max(1, Math.min(50, balance));
  betRange.max = String(maxBet);
  if (Number(betRange.value) > maxBet) betRange.value = String(maxBet);

  if (balance <= 0) {
    betRange.disabled = true;
    spinButton.disabled = true;
    betAmount.textContent = "0";
    chanceText.textContent = "0%";
    rouletteChance.textContent = "0%";
    chanceMeter.style.width = "0%";
    casinoResult.textContent = "Sem minutos livres restantes hoje.";
    casinoResult.className = "casino-result lose";
    return;
  }

  betRange.disabled = casinoSpinning;
  spinButton.disabled = casinoSpinning;

  const bet = Math.max(1, Number(betRange.value));
  const chance = chanceForBet(bet);
  betAmount.textContent = bet;
  chanceText.textContent = `${chance}%`;
  rouletteChance.textContent = `${chance}%`;
  chanceMeter.style.width = `${chance * 2}%`;
}

function openCasino() {
  casinoTeaserDismissed = true;
  updateCasinoTeaser();
  if (!casinoModal || casinoModal.classList.contains("is-open")) return;
  casinoModal.classList.add("is-open");
  casinoModal.querySelector(".casino-card")?.classList.remove("is-win", "is-loss");
  casinoModal.setAttribute("aria-hidden", "false");
  casinoResult.textContent = "ESCOLHA A APOSTA E GIRE!";
  casinoResult.className = "casino-result";
  refreshCasinoUI();
  if (casinoVideo) {
    casinoVideo.muted = false;
    casinoVideo.volume = .75;
    casinoVideo.play().catch(() => {});
  }
  casinoFanfare();
}

function closeCasino() {
  if (casinoSpinning) return;
  casinoModal.classList.remove("is-open");
  casinoModal.setAttribute("aria-hidden", "true");
  casinoVideo?.pause();
  lastTick = performance.now();
}

function updateCasinoTeaser() {
  casinoTeaser?.classList.toggle("is-visible", firstQuizPassed && !casinoTeaserDismissed);
}

function casinoBeep(frequency = 440, duration = 0.06) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.addEventListener("ended", () => ctx.close());
  } catch (_) {}
}

function casinoFanfare() {
  casinoBeep(523, .08);
  setTimeout(() => casinoBeep(659, .08), 90);
  setTimeout(() => casinoBeep(784, .11), 180);
  setTimeout(() => casinoBeep(1046, .16), 300);
}

function celebrateCasinoWin() {
  casinoBeep(660, .08);
  setTimeout(() => casinoBeep(880, .09), 90);
  setTimeout(() => casinoBeep(1100, .12), 180);

  for (let i = 0; i < 42; i++) {
    const piece = document.createElement("i");
    piece.className = "casino-confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `${-10 - Math.random() * 20}px`;
    piece.style.background = `hsl(${Math.floor(Math.random() * 360)} 95% 62%)`;
    piece.style.setProperty("--dx", `${(Math.random() - .5) * 40}vw`);
    piece.style.setProperty("--rot", `${360 + Math.random() * 1080}deg`);
    piece.style.animationDelay = `${Math.random() * .25}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 1900);
  }
}

async function spinCasino() {
  if (casinoSpinning) return;

  const balance = getFreeMinutes();
  const bet = Number(betRange.value);
  if (balance <= 0 || bet < 1 || bet > balance || bet > 50) return;

  casinoSpinning = true;
  casinoModal.querySelector(".casino-card")?.classList.remove("is-win", "is-loss");
  casinoResult.textContent = "🎰 GIRANDO... GIRANDO... GIRANDO...";
  casinoResult.className = "casino-result";
  refreshCasinoUI();

  const chance = chanceForBet(bet);
  const won = Math.random() * 100 < chance;

  // A roleta é visual; a probabilidade real é calculada acima.
  rouletteRotation += 1440 + Math.floor(Math.random() * 720);
  roulette.style.transform = `rotate(${rouletteRotation}deg)`;

  let ticks = 0;
  const tickTimer = setInterval(() => {
    casinoBeep(220 + (ticks % 7) * 28, .025);
    ticks++;
  }, 120);

  await new Promise(resolve => setTimeout(resolve, 3150));
  clearInterval(tickTimer);

  const current = getFreeMinutes();
  if (won) {
    // Aposta N: você recupera os N apostados e recebe mais N; líquido = +N.
    setFreeMinutes(current + bet);
    casinoResult.textContent = `🏆 GANHOU! +${bet} MINUTOS · SALDO: ${getFreeMinutes()} MIN`;
    casinoResult.className = "casino-result win";
    casinoModal.querySelector(".casino-card")?.classList.add("is-win");
    celebrateCasinoWin();
  } else {
    setFreeMinutes(current - bet);
    casinoResult.textContent = `💀 PERDEU! −${bet} MINUTOS · RESTAM: ${getFreeMinutes()} MIN`;
    casinoResult.className = "casino-result lose";
    casinoModal.querySelector(".casino-card")?.classList.add("is-loss");
    casinoBeep(145, .22);
    setTimeout(() => casinoBeep(105, .3), 170);
  }

  casinoSpinning = false;
  refreshCasinoUI();
}

betRange?.addEventListener("input", refreshCasinoUI);
spinButton?.addEventListener("click", spinCasino);
casinoClose?.addEventListener("click", closeCasino);
casinoTeaser?.addEventListener("click", openCasino);

refreshCasinoUI();
