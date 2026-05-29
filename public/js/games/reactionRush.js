/* Reaction Rush — wait for the star, then tap fast. Three attempts, averaged. */
Arcade.register({
  id: "reaction-rush",
  name: "Reaction Rush",
  emoji: "⚡",
  color: "#ff5c8a",
  blurb: "Wait for the star… then tap as fast as you can!",
  skill: "Timing",

  mount(root, api) {
    const ROUNDS = 3;
    const FX = api.fx;
    const PATHS = (window.FxAssets && window.FxAssets.sprites) || {};

    root.innerHTML = `
      <div class="game-status" id="rrStatus">Tap to start. Wait for green, then TAP!</div>
      <div class="reaction-pad idle" id="rrPad">Tap to start</div>
      <p style="color:#5a6483;font-size:.9rem;margin-top:12px" id="rrLog"></p>
    `;
    const pad = root.querySelector("#rrPad");
    const statusEl = root.querySelector("#rrStatus");
    const logEl = root.querySelector("#rrLog");

    let phase = "idle"; // idle | waiting | go | done
    let round = 0;
    let timeoutHandle = null;
    let goTime = 0;
    const times = [];
    let destroyed = false;

    function armRound() {
      phase = "waiting";
      pad.className = "reaction-pad wait";
      pad.textContent = "Wait for it…";
      const delay = 900 + Math.random() * 2200;
      timeoutHandle = setTimeout(() => {
        if (destroyed) return;
        phase = "go";
        pad.className = "reaction-pad go";
        pad.innerHTML = `<img class="rr-target fx-pop" src="${PATHS.targetGo || ""}" alt="TAP!">`;
        goTime = performance.now();
        if (FX) {
          FX.sound("coin");
          FX.haptic(15);
        }
      }, delay);
    }

    function handleTap() {
      if (destroyed) return;

      if (phase === "idle" || phase === "done") {
        round = 0;
        times.length = 0;
        logEl.textContent = "";
        statusEl.textContent = `Round 1 of ${ROUNDS}`;
        armRound();
        return;
      }

      if (phase === "waiting") {
        // Jumped the gun — reset this round.
        clearTimeout(timeoutHandle);
        pad.className = "reaction-pad idle";
        pad.textContent = "Too soon! Tap to retry";
        statusEl.textContent = "Wait for green next time!";
        phase = "idle";
        if (FX) {
          FX.sound("error");
          FX.shake(api.stage(), 8, 300);
          FX.haptic([0, 40]);
        }
        return;
      }

      if (phase === "go") {
        const ms = Math.round(performance.now() - goTime);
        times.push(ms);
        round += 1;
        if (FX) {
          FX.burstAt(pad, { shape: "star", colors: ["#f6c945", "#ffd56b", "#fff5cf"], count: 14, speed: 5 });
          FX.sound("match");
          FX.haptic(12);
        }
        logEl.textContent = times.map((t, i) => `#${i + 1}: ${t}ms`).join("   ");
        if (round >= ROUNDS) {
          finish();
        } else {
          statusEl.textContent = `Round ${round + 1} of ${ROUNDS}`;
          pad.className = "reaction-pad idle";
          pad.textContent = `${ms}ms — tap for next`;
          phase = "idle-next";
        }
        return;
      }

      if (phase === "idle-next") {
        armRound();
      }
    }

    function finish() {
      phase = "done";
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      pad.className = "reaction-pad idle";
      pad.textContent = `Avg ${avg}ms`;
      statusEl.textContent = `Average reaction: ${avg}ms`;

      // Faster average → more reward. Typical human reaction ~250ms.
      let coins = 4;
      let stars = 0;
      if (avg < 280) { coins = 14; stars = 2; }
      else if (avg < 360) { coins = 10; stars = 1; }
      else if (avg < 460) { coins = 7; }

      // Lower time is better → "new best" flourish.
      let summary = "Reaction Rush";
      if (FX) {
        const { isNewBest } = FX.bestTime("reaction-rush", avg);
        if (isNewBest) summary = `Reaction Rush — NEW BEST ${avg}ms! 🏆`;
      }
      api.finish({ coins, stars, summary });
    }

    pad.addEventListener("click", handleTap);

    return {
      destroy() {
        destroyed = true;
        clearTimeout(timeoutHandle);
      },
    };
  },
});
