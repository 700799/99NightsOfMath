/* ===========================================================================
   Focus engine — the "work" half of the work/play ratio.
   Tracks focused study time, runs the math-practice loop, and launches a
   reward break (the Arcade) once the configured focus goal is reached.
   The ratio (default 30 min focus → 5 min play) comes from the server and is
   admin-configurable; see /admin.html.
   =========================================================================== */
(function () {
  const STORAGE_KEY = "nnm_focus";
  const today = () => new Date().toISOString().slice(0, 10);

  // --- Persistent per-day state -------------------------------------------
  function loadState() {
    let s = {};
    try {
      s = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      s = {};
    }
    if (s.date !== today()) {
      s = { date: today(), accrued: 0, total: 0, solved: 0, coins: 0, stars: 0, breaks: 0 };
    }
    return s;
  }
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage may be unavailable; the session still works in-memory */
    }
  }

  const state = loadState();

  // Default config until the server responds.
  let config = { workMinutes: 30, playMinutes: 5, label: "30 min focus → 5 min play" };

  // --- DOM refs ------------------------------------------------------------
  const el = (id) => document.getElementById(id);
  const progressFill = el("breakProgress");
  const focusElapsed = el("focusElapsed");
  const focusGoal = el("focusGoal");
  const ratioPill = el("ratioPill");
  const coinCount = el("coinCount");
  const starCount = el("starCount");
  const solvedCount = el("solvedCount");
  const pausedNote = el("pausedNote");

  const topicBadge = el("problemTopic");
  const questionEl = el("problemQuestion");
  const answerForm = el("answerForm");
  const answerInput = el("answerInput");
  const hintBtn = el("hintBtn");
  const skipBtn = el("skipBtn");
  const feedback = el("feedback");

  // --- Helpers -------------------------------------------------------------
  function fmt(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
  function goalSeconds() {
    return Math.max(1, Math.round(config.workMinutes * 60));
  }
  function bump(node) {
    node.classList.remove("bump");
    void node.offsetWidth; // restart animation
    node.classList.add("bump");
  }

  function renderWallet() {
    coinCount.textContent = state.coins;
    starCount.textContent = state.stars;
    solvedCount.textContent = state.solved;
  }
  function renderProgress() {
    const goal = goalSeconds();
    const pct = Math.min(100, (state.accrued / goal) * 100);
    progressFill.style.width = pct + "%";
    focusElapsed.textContent = fmt(state.accrued);
    focusGoal.textContent = fmt(goal);
  }

  // --- Math practice loop --------------------------------------------------
  let current = null;
  let queue = [];
  let wrongTries = 0;

  function normalize(value) {
    return String(value).toLowerCase().replace(/\s+/g, "").replace(/\.+$/, "");
  }

  async function fetchProblem() {
    if (queue.length === 0) {
      try {
        const res = await fetch("/api/practice");
        const data = await res.json();
        queue.push(data);
      } catch (e) {
        queue.push({
          topic: "Mental Math",
          question: "What is 7 × 8?",
          hint: "Skip-count by 8s.",
          answer: "56",
        });
      }
    }
    return queue.shift();
  }

  async function nextProblem() {
    current = await fetchProblem();
    wrongTries = 0;
    topicBadge.textContent = current.topic || "Practice";
    questionEl.textContent = current.question;
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.value = "";
    answerInput.focus();
  }

  function onCorrect() {
    state.solved += 1;
    state.coins += 2; // small correctness bonus, separate from the time gate
    bump(coinCount);
    saveState();
    renderWallet();
    feedback.textContent = "✅ Correct! +2 🪙";
    feedback.className = "feedback good";
    setTimeout(nextProblem, 650);
  }

  answerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!current) return;
    const guess = normalize(answerInput.value);
    if (!guess) return;
    if (guess === normalize(current.answer)) {
      onCorrect();
    } else {
      wrongTries += 1;
      if (wrongTries >= 2) {
        feedback.textContent = `Not quite. Answer: ${current.answer}. Here's a fresh one →`;
        feedback.className = "feedback bad";
        setTimeout(nextProblem, 1400);
      } else {
        feedback.textContent = "❌ Not quite — try again, or tap 💡 Hint.";
        feedback.className = "feedback bad";
        answerInput.select();
      }
    }
  });

  hintBtn.addEventListener("click", () => {
    if (!current) return;
    feedback.textContent = "💡 " + (current.hint || "Take it step by step.");
    feedback.className = "feedback";
  });

  skipBtn.addEventListener("click", () => {
    nextProblem();
  });

  // --- Work timer ----------------------------------------------------------
  function tick() {
    // Only accrue focus time while the tab is visible and no break is running.
    if (document.hidden || Arcade.isActive()) {
      pausedNote.hidden = !document.hidden;
      return;
    }
    pausedNote.hidden = true;

    state.accrued += 1;
    state.total += 1;
    saveState();
    renderProgress();

    if (state.accrued >= goalSeconds()) {
      startBreak();
    }
  }

  function startBreak() {
    if (Arcade.isActive()) return;
    const playSeconds = Math.max(5, Math.round(config.playMinutes * 60));
    Arcade.startBreak(playSeconds, {
      onCoins: (n) => {
        state.coins += n;
        bump(coinCount);
        renderWallet();
        saveState();
      },
      onStars: (n) => {
        state.stars += n;
        bump(starCount);
        renderWallet();
        saveState();
      },
      onEnd: () => {
        state.accrued = 0;
        state.breaks += 1;
        saveState();
        renderProgress();
        answerInput.focus();
      },
    });
  }

  // --- Boot ----------------------------------------------------------------
  async function loadConfig() {
    try {
      const res = await fetch("/api/reward/config");
      const data = await res.json();
      config = { ...config, ...data };
    } catch (e) {
      /* keep defaults */
    }
    ratioPill.textContent = config.label || `${config.workMinutes} min focus → ${config.playMinutes} min play`;
    renderProgress();
  }

  document.addEventListener("visibilitychange", () => {
    pausedNote.hidden = !document.hidden || Arcade.isActive();
  });

  renderWallet();
  renderProgress();
  loadConfig();
  nextProblem();
  setInterval(tick, 1000);
})();
