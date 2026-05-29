/* Dice Duel — roll against the CPU across three rounds. Win the most to score. */
Arcade.register({
  id: "dice-duel",
  name: "Dice Duel",
  emoji: "🎲",
  color: "#36c2a6",
  blurb: "Roll higher than the CPU across three rounds.",
  skill: "Luck",

  mount(root, api) {
    const ROUNDS = 3;
    const FX = api.fx;
    const STARS = ["#f6c945", "#ffd56b", "#fff5cf"];

    // Procedural pip layout (percentages within the die face).
    const PIP_POS = {
      TL: [28, 28], TR: [72, 28], ML: [28, 50], MR: [72, 50],
      C: [50, 50], BL: [28, 72], BR: [72, 72],
    };
    const PIP_MAP = {
      1: ["C"], 2: ["TL", "BR"], 3: ["TL", "C", "BR"],
      4: ["TL", "TR", "BL", "BR"], 5: ["TL", "TR", "C", "BL", "BR"],
      6: ["TL", "TR", "ML", "MR", "BL", "BR"],
    };
    function renderPips(el, v) {
      el.innerHTML = PIP_MAP[v]
        .map((k) => `<span class="pip" style="left:${PIP_POS[k][0]}%;top:${PIP_POS[k][1]}%"></span>`)
        .join("");
    }

    root.innerHTML = `
      <div class="game-status" id="ddStatus">Best of ${ROUNDS}. Roll to play!</div>
      <div class="dice-arena">
        <div class="dice-side">
          <div class="who">You</div>
          <div class="dice" id="ddYou"></div>
          <div class="dice-score" id="ddYouScore">Wins: 0</div>
        </div>
        <div class="dice-side">
          <div class="who">CPU</div>
          <div class="dice" id="ddCpu"></div>
          <div class="dice-score" id="ddCpuScore">Wins: 0</div>
        </div>
      </div>
      <button class="game-cta" id="ddRoll">Roll!</button>
    `;

    const statusEl = root.querySelector("#ddStatus");
    const youDie = root.querySelector("#ddYou");
    const cpuDie = root.querySelector("#ddCpu");
    const youScoreEl = root.querySelector("#ddYouScore");
    const cpuScoreEl = root.querySelector("#ddCpuScore");
    const rollBtn = root.querySelector("#ddRoll");

    let round = 0;
    let youWins = 0;
    let cpuWins = 0;
    let busy = false;
    let timers = [];

    const d6 = () => 1 + Math.floor(Math.random() * 6);

    renderPips(youDie, 1);
    renderPips(cpuDie, 1);

    function roll() {
      if (busy || round >= ROUNDS) return;
      busy = true;
      rollBtn.disabled = true;
      youDie.classList.remove("win", "lose");
      cpuDie.classList.remove("win", "lose");
      youDie.classList.add("rolling");
      cpuDie.classList.add("rolling");

      // Quick shuffle animation.
      let ticks = 0;
      const shuffle = setInterval(() => {
        renderPips(youDie, d6());
        renderPips(cpuDie, d6());
        ticks += 1;
        if (FX && ticks % 2 === 0) FX.sound("tick");
        if (ticks > 8) {
          clearInterval(shuffle);
          resolve();
        }
      }, 70);
      timers.push(shuffle);
    }

    function resolve() {
      const you = d6();
      const cpu = d6();
      renderPips(youDie, you);
      renderPips(cpuDie, cpu);
      youDie.classList.remove("rolling");
      cpuDie.classList.remove("rolling");
      round += 1;

      let msg;
      if (you > cpu) {
        youWins += 1;
        msg = `You rolled ${you} vs ${cpu} — you win the round! 🎉`;
        youDie.classList.add("win");
        cpuDie.classList.add("lose");
        if (FX) {
          FX.sound("match");
          FX.burstAt(youDie, { shape: "star", colors: STARS, count: 12, speed: 5 });
          FX.haptic(12);
        }
      } else if (cpu > you) {
        cpuWins += 1;
        msg = `You rolled ${you} vs ${cpu} — CPU wins the round.`;
        cpuDie.classList.add("win");
        youDie.classList.add("lose");
        if (FX) FX.sound("error");
      } else {
        msg = `Tie at ${you}! No point.`;
        if (FX) FX.sound("tick");
      }

      youScoreEl.textContent = `Wins: ${youWins}`;
      cpuScoreEl.textContent = `Wins: ${cpuWins}`;
      statusEl.textContent = msg;

      if (round >= ROUNDS) {
        finish();
      } else {
        busy = false;
        rollBtn.disabled = false;
      }
    }

    function finish() {
      rollBtn.disabled = true;
      let coins, stars, verdict;
      if (youWins > cpuWins) { coins = 12; stars = 1; verdict = "You won the duel! 🏆"; }
      else if (youWins === cpuWins) { coins = 6; stars = 0; verdict = "It's a draw!"; }
      else { coins = 3; stars = 0; verdict = "CPU took it — nice try!"; }

      let summary = "Dice Duel";
      if (FX) {
        const { isNewBest } = FX.highScore("dice-duel", youWins);
        if (isNewBest && youWins > 0) summary = "Dice Duel — NEW BEST! 🏆";
      }
      statusEl.textContent = `${verdict} (${youWins}–${cpuWins})`;
      api.finish({ coins, stars, summary });
    }

    rollBtn.addEventListener("click", roll);

    return {
      destroy() {
        timers.forEach(clearInterval);
      },
    };
  },
});
