/* Echo — Simon-style memory. Watch the pattern light up, then play it back. */
Arcade.register({
  id: "echo",
  name: "Echo",
  emoji: "🎵",
  color: "#7c5cff",
  blurb: "Watch the pattern, then play it back. How long can you echo?",
  skill: "Memory",

  mount(root, api) {
    const MAX_LEN = 12;
    const FREQS = [392, 523, 659, 784]; // pentatonic-ish, one per pad
    const FX = api.fx;

    root.innerHTML = `
      <div class="game-status" id="ecStatus">Watch the pattern…</div>
      <div class="echo-pads" id="ecPads">
        <button class="echo-pad" data-i="0" aria-label="pad 1"></button>
        <button class="echo-pad" data-i="1" aria-label="pad 2"></button>
        <button class="echo-pad" data-i="2" aria-label="pad 3"></button>
        <button class="echo-pad" data-i="3" aria-label="pad 4"></button>
      </div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:12px" id="ecInfo">Press Start to play.</p>
      <button class="game-cta" id="ecStart">Start</button>
    `;
    const statusEl = root.querySelector("#ecStatus");
    const infoEl = root.querySelector("#ecInfo");
    const startBtn = root.querySelector("#ecStart");
    const pads = Array.from(root.querySelectorAll(".echo-pad"));

    let seq = [];
    let inputPos = 0;
    let longest = 0;
    let playing = false;
    let finished = false;
    let started = false;
    const timers = []; // every playback timeout handle (cleared on destroy)

    function beep(idx) {
      if (FX) FX.tone({ freq: FREQS[idx], dur: 0.22, type: "sine", peak: 0.35 });
    }
    function flash(idx) {
      const pad = pads[idx];
      pad.classList.add("lit");
      timers.push(setTimeout(() => pad.classList.remove("lit"), 300));
    }

    function playback() {
      playing = true; // input locked
      statusEl.textContent = "Watch…";
      let t = 350;
      seq.forEach((idx) => {
        timers.push(setTimeout(() => {
          if (finished) return;
          flash(idx);
          beep(idx);
        }, t));
        t += 520;
      });
      timers.push(setTimeout(() => {
        if (finished) return;
        playing = false;
        statusEl.textContent = "Your turn!";
      }, t));
    }

    function nextRound() {
      seq.push((Math.random() * 4) | 0);
      inputPos = 0;
      infoEl.textContent = `Round ${seq.length}`;
      playback();
    }

    function onPad(idx) {
      if (playing || finished || !started) return;
      flash(idx);
      beep(idx);

      if (idx === seq[inputPos]) {
        inputPos += 1;
        if (FX) FX.haptic(8);
        if (inputPos === seq.length) {
          longest = seq.length;
          if (seq.length >= MAX_LEN) { finish(true); return; }
          if (FX) FX.sound("coin");
          statusEl.textContent = "Nice!";
          timers.push(setTimeout(() => { if (!finished) nextRound(); }, 700));
        }
      } else {
        if (FX) {
          FX.sound("error");
          FX.shake(api.stage(), 8, 300);
          FX.haptic([0, 40]);
        }
        finish(false);
      }
    }

    function finish(won) {
      if (finished) return;
      finished = true;
      playing = false;
      timers.forEach(clearTimeout);
      timers.length = 0;

      const coins = longest * 2;
      const stars = longest >= 8 ? 2 : longest >= 4 ? 1 : 0;
      let summary = "Echo";
      if (FX) {
        const { isNewBest } = FX.highScore("echo", longest);
        if (isNewBest && longest > 0) summary = "Echo — NEW BEST! 🏆";
      }
      statusEl.textContent = won
        ? `Perfect echo of ${longest}! 🎉`
        : `Echoed ${longest} in a row!`;
      api.finish({ coins, stars, summary });
    }

    function start() {
      if (started) return;
      started = true;
      seq = [];
      longest = 0;
      startBtn.style.display = "none";
      nextRound();
    }

    pads.forEach((pad, i) => pad.addEventListener("pointerdown", () => onPad(i)));
    startBtn.addEventListener("click", start);

    return {
      destroy() {
        finished = true;
        playing = false;
        timers.forEach(clearTimeout);
        timers.length = 0;
      },
    };
  },
});
