/* Star Chase — steer through the maze and grab every star before time's up. */
Arcade.register({
  id: "star-chase",
  name: "Star Chase",
  emoji: "⭐",
  color: "#f6c945",
  blurb: "Race the maze and grab every star before time runs out!",
  skill: "Navigation",

  mount(root, api) {
    const ROUND_MS = 30000;
    const COLS = 11;
    const ROWS = 11;
    const STAR_COUNT = 6;
    const W = 418;
    const H = 418;
    const CELL = W / COLS;
    const FX = api.fx;
    const STARS = ["#f6c945", "#ffd56b", "#fff5cf"];

    root.innerHTML = `
      <div class="game-status" id="scStatus">Grab all ${STAR_COUNT} stars!</div>
      <canvas class="star-canvas" id="scCanvas" width="${W}" height="${H}"></canvas>
      <div class="star-dpad" id="scPad">
        <button class="dpad-btn dpad-up" data-dc="0" data-dr="-1" aria-label="up">▲</button>
        <button class="dpad-btn dpad-left" data-dc="-1" data-dr="0" aria-label="left">◀</button>
        <button class="dpad-btn dpad-right" data-dc="1" data-dr="0" aria-label="right">▶</button>
        <button class="dpad-btn dpad-down" data-dc="0" data-dr="1" aria-label="down">▼</button>
      </div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:10px">Move with arrow keys, WASD, or the pad.</p>
    `;

    const canvas = root.querySelector("#scCanvas");
    const ctx = canvas.getContext("2d");
    const statusEl = root.querySelector("#scStatus");
    const padEl = root.querySelector("#scPad");

    const sprites = { coin: FX && FX.sprite("coin"), star: FX && FX.sprite("star") };
    if (FX) FX.preload(["coin", "star"]);
    const ready = (img) => img && img.complete && img.naturalWidth;

    let grid = [];
    let stars = [];
    let player = { c: 1, r: 1 };
    let collected = 0;
    let running = true;
    let finished = false;
    let raf = null;
    let startTime = performance.now();

    function toViewport(cx, cy) {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (cx / W) * rect.width, y: rect.top + (cy / H) * rect.height };
    }

    // Recursive-backtracker maze on an odd grid (1 = wall, 0 = floor).
    function genMaze() {
      const g = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
      (function carve(r, c) {
        g[r][c] = 0;
        const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr > 0 && nr < ROWS - 1 && nc > 0 && nc < COLS - 1 && g[nr][nc] === 1) {
            g[r + dr / 2][c + dc / 2] = 0;
            carve(nr, nc);
          }
        }
      })(1, 1);
      return g;
    }

    function scatterStars() {
      const floor = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (grid[r][c] === 0 && !(r === 1 && c === 1)) floor.push({ c, r });
      floor.sort(() => Math.random() - 0.5);
      return floor.slice(0, STAR_COUNT).map((s) => ({ c: s.c, r: s.r, taken: false }));
    }

    function draw() {
      const remaining = ROUND_MS - (performance.now() - startTime);
      ctx.clearRect(0, 0, W, H);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          ctx.fillStyle = grid[r][c] === 1 ? "#2c3a5e" : "#e8f0ff";
          ctx.fillRect(c * CELL, r * CELL, CELL + 1, CELL + 1);
        }
      }

      const s = CELL * 0.72;
      for (const st of stars) {
        if (st.taken) continue;
        const cx = (st.c + 0.5) * CELL;
        const cy = (st.r + 0.5) * CELL;
        if (ready(sprites.star)) {
          ctx.drawImage(sprites.star, cx - s / 2, cy - s / 2, s, s);
        } else {
          ctx.fillStyle = "#f6c945";
          ctx.beginPath();
          ctx.arc(cx, cy, s / 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const px = (player.c + 0.5) * CELL;
      const py = (player.r + 0.5) * CELL;
      if (ready(sprites.coin)) {
        ctx.drawImage(sprites.coin, px - s / 2, py - s / 2, s, s);
      } else {
        ctx.fillStyle = "#1f6feb";
        ctx.beginPath();
        ctx.arc(px, py, s / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#1c2541";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`⭐ ${collected}/${STAR_COUNT}`, 10, 24);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.ceil(Math.max(0, remaining) / 1000)}s`, W - 10, 24);
      ctx.textAlign = "left";
    }

    function tryMove(dc, dr) {
      if (!running || finished) return;
      const nc = player.c + dc;
      const nr = player.r + dr;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
      if (grid[nr][nc] === 1) return; // wall
      player.c = nc;
      player.r = nr;
      if (FX) { FX.sound("tick"); FX.haptic(6); }

      for (const st of stars) {
        if (!st.taken && st.c === player.c && st.r === player.r) {
          st.taken = true;
          collected += 1;
          statusEl.textContent = `⭐ ${collected}/${STAR_COUNT}`;
          if (FX) {
            const v = toViewport((st.c + 0.5) * CELL, (st.r + 0.5) * CELL);
            FX.burst({ x: v.x, y: v.y, shape: "star", colors: STARS, count: 12, speed: 5 });
            FX.sound("coin");
            FX.haptic(12);
          }
          if (collected === STAR_COUNT) { finish(true); return; }
        }
      }
    }

    function onKey(e) {
      const moves = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      const m = moves[e.key];
      if (m) { e.preventDefault(); tryMove(m[0], m[1]); }
    }
    function onPad(e) {
      const btn = e.target.closest(".dpad-btn");
      if (!btn) return;
      e.preventDefault();
      tryMove(Number(btn.dataset.dc), Number(btn.dataset.dr));
    }

    function loop() {
      const remaining = ROUND_MS - (performance.now() - startTime);
      draw();
      if (remaining <= 0) { finish(false); return; }
      raf = requestAnimationFrame(loop);
    }

    function finish(cleared) {
      if (finished) return;
      finished = true;
      running = false;
      cancelAnimationFrame(raf);

      let coins;
      let stars2 = 0;
      let summary = "Star Chase";
      if (cleared) {
        const clearMs = performance.now() - startTime;
        const secsLeft = Math.max(0, (ROUND_MS - clearMs) / 1000);
        coins = collected * 3 + Math.round(secsLeft);
        stars2 = secsLeft >= 15 ? 2 : 1;
        if (FX) {
          const { isNewBest } = FX.bestTime("star-chase", clearMs);
          if (isNewBest) summary = "Star Chase — FASTEST! 🏆";
        }
        statusEl.textContent = `Cleared in ${(clearMs / 1000).toFixed(1)}s!`;
      } else {
        coins = collected * 3;
        statusEl.textContent = `Time! Found ${collected}/${STAR_COUNT} stars.`;
      }
      api.finish({ coins, stars: stars2, summary });
    }

    grid = genMaze();
    stars = scatterStars();
    window.addEventListener("keydown", onKey);
    padEl.addEventListener("pointerdown", onPad);
    raf = requestAnimationFrame(loop);

    return {
      destroy() {
        finished = true;
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener("keydown", onKey);
      },
    };
  },
});
