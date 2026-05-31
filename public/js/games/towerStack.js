/* Tower Stack — time the drop so each block lands on the one below. */
Arcade.register({
  id: "tower-stack",
  name: "Tower Stack",
  emoji: "🧱",
  color: "#2bb673",
  blurb: "Drop each block dead-center to build the tallest tower!",
  skill: "Precision",

  mount(root, api) {
    const ROUND_MS = 30000;
    const W = 360;
    const H = 460;
    const BLOCK_H = 26;
    const FX = api.fx;
    const PALETTE = (FX && FX.PALETTE) || ["#f6c945", "#1f6feb", "#2bb673", "#e4572e", "#7c5cff", "#ff5c8a"];

    root.innerHTML = `
      <div class="game-status" id="tsStatus">Stack the blocks as high as you can!</div>
      <canvas class="tower-canvas" id="tsCanvas" width="${W}" height="${H}"></canvas>
      <div style="margin-top:14px"><button class="game-cta" id="tsStart">Start</button></div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:10px">Tap the canvas or press Space to drop.</p>
    `;

    const canvas = root.querySelector("#tsCanvas");
    const ctx = canvas.getContext("2d");
    const statusEl = root.querySelector("#tsStatus");
    const startBtn = root.querySelector("#tsStart");

    let stack = [];      // [{x, w, y, color}] — y is the block's bottom, in world units above ground
    let current = null;  // moving block {x, w, dir, color}
    let speed = 2.2;
    let cameraY = 0;
    let height = 0;      // successful placements above the base
    let perfects = 0;
    let running = false;
    let finished = false;
    let raf = null;
    let startTime = 0;

    // Canvas coords → viewport coords (for particle bursts).
    function toViewport(cx, cy) {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (cx / W) * rect.width, y: rect.top + (cy / H) * rect.height };
    }
    // World bottom of a block → its top-left canvas y.
    const screenTop = (worldBottom) => H - (worldBottom + BLOCK_H) + cameraY;

    function reset() {
      stack = [{ x: W / 2 - 70, w: 140, y: 0, color: PALETTE[0] }];
      current = { x: 0, w: 140, dir: 1, color: PALETTE[1] };
      speed = 2.2;
      cameraY = 0;
      height = 0;
      perfects = 0;
    }

    function drawBlock(b, worldBottom) {
      const y = screenTop(worldBottom);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, y, b.w, BLOCK_H);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(b.x, y, b.w, 5); // top highlight
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x + 0.5, y + 0.5, b.w - 1, BLOCK_H - 1);
    }

    function draw(remaining) {
      ctx.clearRect(0, 0, W, H);
      stack.forEach((b) => drawBlock(b, b.y));
      if (current) drawBlock(current, stack.length * BLOCK_H);

      ctx.fillStyle = "#1c2541";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`🧱 ${height}`, 12, 26);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.ceil(Math.max(0, remaining) / 1000)}s`, W - 12, 26);
      ctx.textAlign = "left";
    }

    function drop() {
      if (!running || finished || !current) return;
      const top = stack[stack.length - 1];
      const left = Math.max(current.x, top.x);
      const right = Math.min(current.x + current.w, top.x + top.w);
      const overlap = right - left;

      if (overlap <= 0) {
        if (FX) {
          FX.sound("error");
          FX.shake(api.stage(), 9, 320);
          FX.haptic([0, 40]);
        }
        finish();
        return;
      }

      const overhang = current.w - overlap;
      const worldBottom = stack.length * BLOCK_H;
      if (overhang > 2 && FX) {
        const droppedRight = current.x + current.w > right;
        const sliceX = droppedRight ? right + overhang / 2 : left - overhang / 2;
        const v = toViewport(sliceX, screenTop(worldBottom) + BLOCK_H / 2);
        FX.burst({ x: v.x, y: v.y, shape: "rect", colors: [current.color], count: 8, speed: 5, gravity: 0.45 });
      }

      const perfect = overhang <= 6;
      if (perfect) {
        perfects += 1;
        if (FX) { FX.sound("match"); FX.haptic(15); }
      } else if (FX) {
        FX.sound("coin");
        FX.haptic(10);
      }

      stack.push({ x: left, w: overlap, y: worldBottom, color: current.color });
      height += 1;
      speed = Math.min(6.5, 2.2 + height * 0.18);
      current = { x: 0, w: overlap, dir: 1, color: PALETTE[height % PALETTE.length] };
      statusEl.textContent = perfect ? "Perfect! 🎯" : `Height: ${height}`;
    }

    function loop(now) {
      const remaining = ROUND_MS - (now - startTime);
      current.x += speed * current.dir;
      if (current.x <= 0) { current.x = 0; current.dir = 1; }
      if (current.x + current.w >= W) { current.x = W - current.w; current.dir = -1; }

      const targetCam = Math.max(0, stack.length * BLOCK_H - H * 0.5);
      cameraY += (targetCam - cameraY) * 0.12;

      draw(remaining);
      if (remaining <= 0) { finish(); return; }
      raf = requestAnimationFrame(loop);
    }

    function finish() {
      if (finished) return;
      finished = true;
      running = false;
      cancelAnimationFrame(raf);

      const coins = height * 2 + perfects * 2;
      const stars = height >= 12 ? 2 : height >= 6 ? 1 : 0;
      let summary = "Tower Stack";
      if (FX) {
        const { isNewBest } = FX.highScore("tower-stack", height);
        if (isNewBest && height > 0) summary = "Tower Stack — NEW BEST! 🏆";
      }
      statusEl.textContent = `Tower height: ${height}!`;
      api.finish({ coins, stars, summary });
    }

    function onKey(e) {
      if (e.code === "Space" || e.key === " ") { e.preventDefault(); drop(); }
    }
    function onPointer(e) { e.preventDefault(); drop(); }

    function start() {
      if (running) return;
      running = true;
      reset();
      startBtn.style.display = "none";
      statusEl.textContent = "Drop! 🧱";
      startTime = performance.now();
      raf = requestAnimationFrame(loop);
    }

    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    startBtn.addEventListener("click", start);
    reset();
    draw(ROUND_MS);

    return {
      destroy() {
        finished = true;
        running = false;
        cancelAnimationFrame(raf);
        canvas.removeEventListener("pointerdown", onPointer);
        window.removeEventListener("keydown", onKey);
      },
    };
  },
});
