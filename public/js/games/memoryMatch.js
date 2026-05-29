/* Memory Match — flip cards to find all 8 matching pairs before time runs out. */
Arcade.register({
  id: "memory-match",
  name: "Memory Match",
  emoji: "🧠",
  color: "#7c5cff",
  blurb: "Flip the cards and find every matching pair.",
  skill: "Memory",

  mount(root, api) {
    const FACES = ["🌟", "🍄", "🐢", "🌸", "🔥", "💎", "🦊", "🎵"];
    const ROUND_MS = 60000;

    root.innerHTML = `
      <div class="game-status" id="mmStatus">Match all 8 pairs!</div>
      <div class="memory-grid" id="mmGrid"></div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:12px" id="mmTimer"></p>
    `;
    const grid = root.querySelector("#mmGrid");
    const statusEl = root.querySelector("#mmStatus");
    const timerEl = root.querySelector("#mmTimer");

    // Build & shuffle deck.
    const deck = FACES.concat(FACES)
      .map((face) => ({ face, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort);

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
      card.innerHTML = `<span class="face">${item.face}</span>`;
      card.addEventListener("click", () => flip(card, item));
      grid.appendChild(card);
    });

    function flip(card, item) {
      if (lock || finished) return;
      if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

      card.classList.add("flipped");

      if (!first) {
        first = { card, item };
        return;
      }

      moves += 1;
      if (first.item.face === item.face) {
        first.card.classList.add("matched");
        card.classList.add("matched");
        first = null;
        matched += 1;
        if (matched === FACES.length) finish(true);
      } else {
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

      statusEl.textContent = complete
        ? `Cleared in ${moves} moves! 🎉`
        : `Time! You matched ${matched}/${FACES.length} pairs.`;
      api.finish({ coins, stars, summary: "Memory Match" });
    }

    return {
      destroy() {
        finished = true;
        clearInterval(timerHandle);
      },
    };
  },
});
