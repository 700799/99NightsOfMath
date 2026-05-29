/* Dice Duel — roll against the CPU across three rounds. Win the most to score. */
Arcade.register({
  id: "dice-duel",
  name: "Dice Duel",
  emoji: "🎲",
  color: "#36c2a6",
  blurb: "Roll higher than the CPU across three rounds.",
  skill: "Luck",

  mount(root, api) {
    const PIPS = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const ROUNDS = 3;

    root.innerHTML = `
      <div class="game-status" id="ddStatus">Best of ${ROUNDS}. Roll to play!</div>
      <div class="dice-arena">
        <div class="dice-side">
          <div class="who">You</div>
          <div class="dice" id="ddYou">🎲</div>
          <div class="dice-score" id="ddYouScore">Wins: 0</div>
        </div>
        <div class="dice-side">
          <div class="who">CPU</div>
          <div class="dice" id="ddCpu">🎲</div>
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

    function roll() {
      if (busy || round >= ROUNDS) return;
      busy = true;
      rollBtn.disabled = true;
      youDie.classList.add("rolling");
      cpuDie.classList.add("rolling");

      // Quick shuffle animation.
      let ticks = 0;
      const shuffle = setInterval(() => {
        youDie.textContent = PIPS[d6()];
        cpuDie.textContent = PIPS[d6()];
        ticks += 1;
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
      youDie.textContent = PIPS[you];
      cpuDie.textContent = PIPS[cpu];
      youDie.classList.remove("rolling");
      cpuDie.classList.remove("rolling");
      round += 1;

      let msg;
      if (you > cpu) { youWins += 1; msg = `You rolled ${you} vs ${cpu} — you win the round! 🎉`; }
      else if (cpu > you) { cpuWins += 1; msg = `You rolled ${you} vs ${cpu} — CPU wins the round.`; }
      else { msg = `Tie at ${you}! No point.`; }

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
      statusEl.textContent = `${verdict} (${youWins}–${cpuWins})`;
      api.finish({ coins, stars, summary: "Dice Duel" });
    }

    rollBtn.addEventListener("click", roll);

    return {
      destroy() {
        timers.forEach(clearInterval);
      },
    };
  },
});
