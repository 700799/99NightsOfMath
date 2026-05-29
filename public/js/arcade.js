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

  // ---- Confetti (delegates to the shared Fx particle system) --------------
  function confetti(durationMs = 1600) {
    if (window.Fx) Fx.confetti(durationMs);
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
        <button class="arcade-mute" id="arcadeMute" title="Sound on/off" aria-label="Toggle sound">🔊</button>
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

    // Mute toggle lives in the bar so it's reachable during any game.
    const muteBtn = overlay.querySelector("#arcadeMute");
    const renderMute = () => {
      muteBtn.textContent = window.Fx && Fx.isMuted() ? "🔇" : "🔊";
    };
    muteBtn.addEventListener("click", () => {
      if (window.Fx) Fx.toggleMuted();
      renderMute();
    });
    renderMute();

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
      fx: window.Fx,
      gameId: game.id,
      // The stage element is the safe shake target (never the game's own
      // transformed sprites).
      stage: () => state && state.bodyEl ? state.bodyEl.querySelector(".game-stage") : null,
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
    if (stars > 0) {
      confetti(900);
      if (window.Fx) Fx.sound("win");
    }

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
