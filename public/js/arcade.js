/* ===========================================================================
   Arcade engine — runs a timed reward "play break".
   Games register themselves with Arcade.register(game). focus.js calls
   Arcade.startBreak(seconds, hooks) when the student has earned a break.
   =========================================================================== */
(function () {
  const games = [];

  // Active break state (null when no break is running).
  let state = null;

  function register(game) {
    games.push(game);
  }

  function list() {
    return games.slice();
  }

  function fmtTime(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  // ---- Confetti -----------------------------------------------------------
  function confetti(durationMs = 1600) {
    let canvas = document.getElementById("confettiCanvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "confettiCanvas";
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    const colors = ["#f6c945", "#1f6feb", "#2bb673", "#e4572e", "#7c5cff", "#ff5c8a"];
    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      r: 4 + Math.random() * 6,
      c: colors[(Math.random() * colors.length) | 0],
      vy: 2 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
    }));
    const start = performance.now();
    function frame(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
      }
      if (now - start < durationMs) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(frame);
  }

  function toast(message, ms = 2200) {
    const el = document.createElement("div");
    el.className = "result-toast";
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  // ---- Break lifecycle ----------------------------------------------------
  function startBreak(seconds, hooks = {}) {
    if (state) return; // already in a break

    state = {
      secondsLeft: seconds,
      coins: 0,
      stars: 0,
      hooks,
      activeController: null,
      tickHandle: null,
      overlay: null,
      timerEl: null,
      tallyEl: null,
    };

    buildOverlay();
    showPicker();
    confetti();

    state.tickHandle = setInterval(tick, 1000);
  }

  function tick() {
    if (!state) return;
    state.secondsLeft -= 1;
    renderTimer();
    if (state.secondsLeft <= 0) {
      endBreak(true);
    }
  }

  function renderTimer() {
    if (!state || !state.timerEl) return;
    state.timerEl.textContent = fmtTime(state.secondsLeft);
    state.timerEl.classList.toggle("low", state.secondsLeft <= 10);
  }

  function renderTally() {
    if (!state || !state.tallyEl) return;
    state.tallyEl.textContent = `🪙 ${state.coins}   ⭐ ${state.stars}`;
  }

  function buildOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "arcade-overlay";
    overlay.innerHTML = `
      <div class="arcade-bar">
        <div class="arcade-title">🎉 PLAY BREAK</div>
        <div class="arcade-timer" id="arcadeTimer">0:00</div>
        <div class="arcade-tally" id="arcadeTally">🪙 0   ⭐ 0</div>
        <button class="arcade-end" id="arcadeEnd">End early ✕</button>
      </div>
      <div class="arcade-body" id="arcadeBody"></div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    state.overlay = overlay;
    state.bodyEl = overlay.querySelector("#arcadeBody");
    state.timerEl = overlay.querySelector("#arcadeTimer");
    state.tallyEl = overlay.querySelector("#arcadeTally");
    overlay.querySelector("#arcadeEnd").addEventListener("click", () => endBreak(false));

    renderTimer();
    renderTally();
  }

  function teardownActiveGame() {
    if (state && state.activeController) {
      try {
        if (typeof state.activeController.destroy === "function") {
          state.activeController.destroy();
        }
      } catch (e) {
        /* ignore cleanup errors */
      }
      state.activeController = null;
    }
  }

  function showPicker() {
    teardownActiveGame();
    if (!state) return;

    const cards = games
      .map(
        (g) => `
        <div class="game-card" data-id="${g.id}" style="border-top-color:${g.color}">
          <div class="emoji">${g.emoji}</div>
          <h3>${g.name}</h3>
          <p class="blurb">${g.blurb}</p>
          <span class="skill">${g.skill || "Fun"}</span>
        </div>`
      )
      .join("");

    state.bodyEl.innerHTML = `
      <div class="arcade-heading">
        <h2>Pick a mini-game!</h2>
        <p>You earned this break — relax, play, and bank some coins. ⭐</p>
      </div>
      <div class="game-grid">${cards}</div>
    `;

    state.bodyEl.querySelectorAll(".game-card").forEach((card) => {
      card.addEventListener("click", () => launchGame(card.getAttribute("data-id")));
    });
  }

  function launchGame(id) {
    const game = games.find((g) => g.id === id);
    if (!game || !state) return;

    state.bodyEl.innerHTML = `
      <div class="game-stage">
        <button class="stage-back" id="stageBack">↩ Back to games</button>
        <h3>${game.emoji} ${game.name}</h3>
        <div id="gameMount"></div>
      </div>
    `;
    state.bodyEl.querySelector("#stageBack").addEventListener("click", showPicker);

    const mount = state.bodyEl.querySelector("#gameMount");
    const api = {
      secondsLeft: () => (state ? state.secondsLeft : 0),
      finish: (result) => onGameFinish(game, result || {}),
      confetti,
    };

    teardownActiveGame();
    state.activeController = game.mount(mount, api) || null;
  }

  function onGameFinish(game, result) {
    if (!state) return;
    const coins = Math.max(0, Math.round(result.coins || 0));
    const stars = Math.max(0, Math.round(result.stars || 0));
    state.coins += coins;
    state.stars += stars;
    renderTally();

    if (coins && state.hooks.onCoins) state.hooks.onCoins(coins);
    if (stars && state.hooks.onStars) state.hooks.onStars(stars);
    if (stars > 0) confetti(900);

    const bits = [];
    if (coins) bits.push(`+${coins} 🪙`);
    if (stars) bits.push(`+${stars} ⭐`);
    const earned = bits.length ? bits.join("  ") : "Good try!";
    toast(`${result.summary ? result.summary + "  " : ""}${earned}`);

    // Return to the picker if there is still time; otherwise the timer will
    // end the break on its own shortly.
    if (state.secondsLeft > 2) {
      setTimeout(showPicker, 900);
    }
  }

  function endBreak(timedOut) {
    if (!state) return;
    clearInterval(state.tickHandle);
    teardownActiveGame();

    const { coins, stars, hooks } = state;

    // Closing summary.
    state.bodyEl.innerHTML = `
      <div class="arcade-heading">
        <h2>${timedOut ? "⏰ Break's over!" : "Back to it! 💪"}</h2>
        <p>You banked <b>${coins} 🪙</b> and <b>${stars} ⭐</b> this break.</p>
        <p>Nice reset — your brain is recharged for the next round.</p>
      </div>
    `;
    confetti(1200);

    const overlay = state.overlay;
    state = null;
    document.body.style.overflow = "";

    setTimeout(() => {
      if (overlay) overlay.remove();
      if (hooks.onEnd) hooks.onEnd({ coins, stars, timedOut });
    }, 1500);
  }

  function isActive() {
    return state !== null;
  }

  window.Arcade = { register, list, startBreak, confetti, toast, fmtTime, isActive };
})();
