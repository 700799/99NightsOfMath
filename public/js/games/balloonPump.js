/* Balloon Pump — pump to grow the balloon and the payout, but bank it before
   it pops! Push your luck for 20 seconds. */
Arcade.register({
  id: "balloon-pump",
  name: "Balloon Pump",
  emoji: "🎈",
  color: "#ff8a3d",
  blurb: "Mash the button to pump the biggest balloon — don't pop it!",
  skill: "Nerve",

  mount(root, api) {
    const ROUND_MS = 20000;

    root.innerHTML = `
      <div class="game-status" id="bpStatus">Pump for coins, then Bank before it pops!</div>
      <div class="balloon-wrap"><div class="balloon" id="bpBalloon"></div></div>
      <p style="font-weight:800;margin:8px 0">
        At risk: <span id="bpRisk">0</span> 🪙 &nbsp;·&nbsp; Banked: <span id="bpBank">0</span> 🪙
      </p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="game-cta" id="bpPump">Pump 🎈</button>
        <button class="game-cta" id="bpBankBtn" style="background:#2bb673">Bank 💰</button>
      </div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:12px" id="bpTimer"></p>
    `;

    const balloon = root.querySelector("#bpBalloon");
    const statusEl = root.querySelector("#bpStatus");
    const riskEl = root.querySelector("#bpRisk");
    const bankEl = root.querySelector("#bpBank");
    const pumpBtn = root.querySelector("#bpPump");
    const bankBtn = root.querySelector("#bpBankBtn");
    const timerEl = root.querySelector("#bpTimer");

    let pumps = 0;
    let risk = 0;
    let banked = 0;
    let started = false;
    let finished = false;
    let startTime = 0;
    let timerHandle = null;

    function setBalloonScale() {
      const scale = 1 + pumps * 0.18;
      balloon.style.transform = `scale(${scale})`;
    }

    function resetBalloon() {
      pumps = 0;
      risk = 0;
      balloon.classList.remove("popped");
      setBalloonScale();
      riskEl.textContent = "0";
    }

    function startTimerOnce() {
      if (started) return;
      started = true;
      startTime = performance.now();
      timerHandle = setInterval(() => {
        const remaining = ROUND_MS - (performance.now() - startTime);
        timerEl.textContent = `⏱ ${Math.ceil(Math.max(0, remaining) / 1000)}s`;
        if (remaining <= 0) finish();
      }, 200);
    }

    function pump() {
      if (finished) return;
      startTimerOnce();
      pumps += 1;
      risk += 3;
      riskEl.textContent = String(risk);
      setBalloonScale();

      // Pop chance climbs with each pump.
      const popChance = Math.min(0.85, pumps * 0.06);
      if (Math.random() < popChance) {
        balloon.classList.add("popped");
        balloon.style.transform = "scale(0.4)";
        statusEl.textContent = `💥 POP! Lost ${risk} coins. Keep going!`;
        setTimeout(resetBalloon, 450);
      } else {
        statusEl.textContent = `Risking ${risk} 🪙 — bank it or push your luck?`;
      }
    }

    function bank() {
      if (finished || risk === 0) return;
      startTimerOnce();
      banked += risk;
      bankEl.textContent = String(banked);
      statusEl.textContent = `Banked ${risk} 🪙! Pump again.`;
      resetBalloon();
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(timerHandle);
      pumpBtn.disabled = true;
      bankBtn.disabled = true;

      const coins = banked;
      const stars = coins >= 45 ? 2 : coins >= 22 ? 1 : 0;
      statusEl.textContent = `Time! You banked ${coins} coins. 🎈`;
      api.finish({ coins, stars, summary: "Balloon Pump" });
    }

    pumpBtn.addEventListener("click", pump);
    bankBtn.addEventListener("click", bank);
    resetBalloon();

    return {
      destroy() {
        finished = true;
        clearInterval(timerHandle);
      },
    };
  },
});
