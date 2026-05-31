/* Bonk! — whack the moles as they pop up, but don't hit the bombs. */
Arcade.register({
  id: "mole-bonk",
  name: "Bonk!",
  emoji: "🔨",
  color: "#8a5c3a",
  blurb: "Bonk the moles, dodge the bombs — go fast!",
  skill: "Accuracy",

  mount(root, api) {
    const ROUND_MS = 25000;
    const HOLES = 9;
    const BOMB_CHANCE = 0.22;
    const FX = api.fx;
    const PATHS = (window.FxAssets && window.FxAssets.sprites) || {};
    const STARS = ["#f6c945", "#ffd56b", "#fff5cf"];

    root.innerHTML = `
      <div class="game-status" id="mbStatus">Bonk the moles — avoid the bombs 💣</div>
      <div class="bonk-grid" id="mbGrid"></div>
      <div style="margin-top:14px"><button class="game-cta" id="mbStart">Start</button></div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:10px" id="mbTimer"></p>
    `;
    const grid = root.querySelector("#mbGrid");
    const statusEl = root.querySelector("#mbStatus");
    const startBtn = root.querySelector("#mbStart");
    const timerEl = root.querySelector("#mbTimer");

    let bonks = 0;
    let running = false;
    let finished = false;
    let startTime = 0;
    let spawnHandle = null;
    let tickHandle = null;
    const holes = [];

    if (FX) FX.preload(["mole", "bomb"]);

    // Build the 3×3 board of holes; each owns its own pop-up actor + retract timer.
    for (let i = 0; i < HOLES; i++) {
      const el = document.createElement("div");
      el.className = "bonk-hole";
      el.innerHTML = `<div class="bonk-mound"></div><img class="bonk-actor" alt="">`;
      const actorEl = el.querySelector(".bonk-actor");
      const hole = { el, actorEl, kind: null, timer: null };
      el.addEventListener("pointerdown", () => onHit(hole));
      grid.appendChild(el);
      holes.push(hole);
    }

    const frac = () => Math.min(1, (performance.now() - startTime) / ROUND_MS);
    const gap = () => 750 - 370 * frac(); // spawns speed up over the round
    const visMs = () => Math.max(550, 1100 - 600 * frac()); // visible window shrinks

    function retract(hole) {
      hole.el.classList.remove("up");
      clearTimeout(hole.timer);
      hole.timer = null;
      hole.kind = null;
    }

    function spawnOne() {
      const empty = holes.filter((h) => !h.kind);
      if (!empty.length) return;
      const hole = empty[(Math.random() * empty.length) | 0];
      hole.kind = Math.random() < BOMB_CHANCE ? "bomb" : "mole";
      hole.actorEl.src = (hole.kind === "bomb" ? PATHS.bomb : PATHS.mole) || "";
      hole.el.classList.add("up");
      hole.timer = setTimeout(() => retract(hole), visMs());
    }

    function scheduleNext() {
      spawnHandle = setTimeout(() => {
        if (finished) return;
        spawnOne();
        scheduleNext();
      }, gap());
    }

    function onHit(hole) {
      if (!running || finished || !hole.kind) return;
      const kind = hole.kind;
      clearTimeout(hole.timer);
      retract(hole);

      if (kind === "mole") {
        bonks += 1;
        hole.el.classList.remove("boom");
        hole.el.classList.add("bonked");
        setTimeout(() => hole.el.classList.remove("bonked"), 360);
        if (FX) {
          FX.burstAt(hole.el, { shape: "star", colors: STARS, count: 12, speed: 5 });
          FX.sound("coin");
          FX.haptic(12);
        }
        statusEl.textContent = `🔨 ${bonks}`;
      } else {
        bonks = Math.max(0, bonks - 2);
        hole.el.classList.remove("bonked");
        hole.el.classList.add("boom");
        setTimeout(() => hole.el.classList.remove("boom"), 420);
        if (FX) {
          FX.sound("error");
          FX.shake(api.stage(), 8, 300);
          FX.haptic([0, 40]);
        }
        statusEl.textContent = `💥 Bomb! 🔨 ${bonks}`;
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      running = false;
      clearTimeout(spawnHandle);
      clearInterval(tickHandle);
      holes.forEach((h) => {
        clearTimeout(h.timer);
        h.el.classList.remove("up");
      });

      const coins = bonks;
      const stars = bonks >= 18 ? 2 : bonks >= 9 ? 1 : 0;
      let summary = "Bonk!";
      if (FX) {
        const { isNewBest } = FX.highScore("mole-bonk", bonks);
        if (isNewBest && bonks > 0) summary = "Bonk! — NEW BEST! 🏆";
      }
      statusEl.textContent = `Round over — ${bonks} bonks!`;
      api.finish({ coins, stars, summary });
    }

    function start() {
      if (running) return;
      running = true;
      bonks = 0;
      startBtn.style.display = "none";
      statusEl.textContent = "Go! 🔨";
      startTime = performance.now();
      tickHandle = setInterval(() => {
        const remaining = ROUND_MS - (performance.now() - startTime);
        timerEl.textContent = `⏱ ${Math.ceil(Math.max(0, remaining) / 1000)}s`;
        if (remaining <= 0) finish();
      }, 200);
      scheduleNext();
    }

    startBtn.addEventListener("click", start);

    return {
      destroy() {
        finished = true;
        running = false;
        clearTimeout(spawnHandle);
        clearInterval(tickHandle);
        holes.forEach((h) => clearTimeout(h.timer));
      },
    };
  },
});
