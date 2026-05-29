/* Memory Match — flip cards to find all 8 matching pairs before time runs out. */
Arcade.register({
  id: "memory-match",
  name: "Memory Match",
  emoji: "🧠",
  color: "#7c5cff",
  blurb: "Flip the cards and find every matching pair.",
  skill: "Memory",

  mount(root, api) {
    const FACES = [
      { key: "star", sprite: "faceStar" },
      { key: "mushroom", sprite: "faceMushroom" },
      { key: "turtle", sprite: "faceTurtle" },
      { key: "flower", sprite: "faceFlower" },
      { key: "flame", sprite: "faceFlame" },
      { key: "gem", sprite: "faceGem" },
      { key: "fox", sprite: "faceFox" },
      { key: "note", sprite: "faceNote" },
    ];
    const ROUND_MS = 60000;
    const FX = api.fx;
    const PATHS = (window.FxAssets && window.FxAssets.sprites) || {};
    const STARS = ["#f6c945", "#ffd56b", "#fff5cf"];

    root.innerHTML = `
      <div class="game-status" id="mmStatus">Match all 8 pairs!</div>
      <div class="memory-grid" id="mmGrid"></div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:12px" id="mmTimer"></p>
    `;
    const grid = root.querySelector("#mmGrid");
    const statusEl = root.querySelector("#mmStatus");
    const timerEl = root.querySelector("#mmTimer");

    // Build & shuffle deck (two of each face).
    const deck = FACES.concat(FACES)
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((d) => d.item);

    let first = null;
    let lock = false;
    let matched = 0;
    let moves = 0;
    let finished = false;
    let startTime = performance.now();

    const timerHandle = setInterval(() => {
      const remaining = ROUND_MS - (performance.now() - startTime);
      timerEl.textContent = `⏱ ${Math.ceil(Math.max(0, remaining) / 1000)}s   ·   moves: ${moves}`;
      if (remaining <= 0) finish(false);
    }, 250);

    deck.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "mem-card";
      card.dataset.index = i;
      card.innerHTML = `
        <div class="mem-card__inner">
          <div class="mem-face mem-face--front"><img src="${PATHS.cardBack || ""}" alt=""></div>
          <div class="mem-face mem-face--back"><img src="${PATHS[item.sprite] || ""}" alt=""></div>
        </div>`;
      card.addEventListener("click", () => flip(card, item));
      grid.appendChild(card);
    });

    function flip(card, item) {
      if (lock || finished) return;
      if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

      card.classList.add("flipped");
      if (FX) FX.sound("tick");

      if (!first) {
        first = { card, item };
        return;
      }

      moves += 1;
      if (first.item.key === item.key) {
        first.card.classList.add("matched");
        card.classList.add("matched");
        card.classList.add("fx-pop");
        first.card.classList.add("fx-pop");
        if (FX) {
          FX.sound("match");
          FX.burstAt(card, { shape: "star", colors: STARS, count: 14, speed: 5 });
          FX.burstAt(first.card, { shape: "star", colors: STARS, count: 10, speed: 5 });
          FX.haptic(15);
        }
        first = null;
        matched += 1;
        if (matched === FACES.length) finish(true);
      } else {
        if (FX) FX.sound("error");
        lock = true;
        const a = first.card;
        const b = card;
        setTimeout(() => {
          a.classList.remove("flipped");
          b.classList.remove("flipped");
          first = null;
          lock = false;
        }, 700);
      }
    }

    function finish(complete) {
      if (finished) return;
      finished = true;
      clearInterval(timerHandle);

      // Coins reward efficient play; a clean clear earns stars.
      const coins = matched * 2 + (complete ? Math.max(0, 12 - (moves - FACES.length)) : 0);
      let stars = 0;
      if (complete) stars = moves <= 12 ? 2 : 1;

      // Fewer moves is better → "new best" flourish on a clean clear.
      let summary = "Memory Match";
      if (complete && FX) {
        const { isNewBest } = FX.bestTime("memory-match", moves);
        if (isNewBest) summary = "Memory Match — FEWEST MOVES! 🏆";
      }

      statusEl.textContent = complete
        ? `Cleared in ${moves} moves! 🎉`
        : `Time! You matched ${matched}/${FACES.length} pairs.`;
      api.finish({ coins, stars, summary });
    }

    return {
      destroy() {
        finished = true;
        clearInterval(timerHandle);
      },
    };
  },
});
