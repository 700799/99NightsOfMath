/* Coin Dash — slide the basket to catch falling coins, dodge the bombs. */
Arcade.register({
  id: "coin-dash",
  name: "Coin Dash",
  emoji: "🪙",
  color: "#f6c945",
  blurb: "Catch the falling coins, dodge the bombs!",
  skill: "Reflexes",

  mount(root, api) {
    const ROUND_MS = 25000;
    const W = 520;
    const H = 360;

    root.innerHTML = `
      <div class="game-status" id="cdStatus">Catch coins 🪙, avoid bombs 💣</div>
      <canvas class="coin-canvas" id="cdCanvas" width="${W}" height="${H}"></canvas>
      <div style="margin-top:14px">
        <button class="game-cta" id="cdStart">Start</button>
      </div>
      <p style="color:#5a6483;font-size:.85rem;margin-top:10px">Move with your mouse, finger, or ← → keys.</p>
    `;

    const canvas = root.querySelector("#cdCanvas");
    const ctx = canvas.getContext("2d");
    const statusEl = root.querySelector("#cdStatus");
    const startBtn = root.querySelector("#cdStart");

    const basket = { w: 76, h: 18, x: W / 2 - 38 };
    let drops = [];
    let coins = 0;
    let running = false;
    let raf = null;
    let startTime = 0;
    let lastSpawn = 0;
    let flash = 0;

    const FX = api.fx;
    const sprites = {
      coin: FX && FX.sprite("coin"),
      bomb: FX && FX.sprite("bomb"),
      basket: FX && FX.sprite("basket"),
    };
    if (FX) FX.preload(["coin", "bomb", "basket"]);

    // Canvas coords → viewport coords (for particle bursts).
    function toViewport(cx, cy) {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (cx / W) * rect.width, y: rect.top + (cy / H) * rect.height };
    }
    const ready = (img) => img && img.complete && img.naturalWidth;

    function setBasketByClientX(clientX) {
      const rect = canvas.getBoundingClientRect();
      const scale = W / rect.width;
      const x = (clientX - rect.left) * scale - basket.w / 2;
      basket.x = Math.max(0, Math.min(W - basket.w, x));
    }

    function onMove(e) {
      if (e.touches && e.touches[0]) setBasketByClientX(e.touches[0].clientX);
      else setBasketByClientX(e.clientX);
    }
    function onKey(e) {
      const step = 34;
      if (e.key === "ArrowLeft") basket.x = Math.max(0, basket.x - step);
      if (e.key === "ArrowRight") basket.x = Math.min(W - basket.w, basket.x + step);
    }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); onMove(e); }, { passive: false });
    window.addEventListener("keydown", onKey);

    function spawn() {
      const isBomb = Math.random() < 0.22;
      drops.push({
        x: 20 + Math.random() * (W - 40),
        y: -20,
        r: 15,
        vy: 2.4 + Math.random() * 2.6,
        bomb: isBomb,
      });
    }

    function draw(remaining) {
      ctx.clearRect(0, 0, W, H);

      // falling items — SVG sprites with a vector fallback until they load
      for (const d of drops) {
        const img = d.bomb ? sprites.bomb : sprites.coin;
        if (ready(img)) {
          const s = d.r * 2.3;
          ctx.drawImage(img, d.x - s / 2, d.y - s / 2, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          if (d.bomb) {
            ctx.fillStyle = "#2b2b3a";
            ctx.fill();
          } else {
            ctx.fillStyle = "#f6c945";
            ctx.fill();
            ctx.strokeStyle = "#caa21f";
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }
      }

      // basket
      const by = H - 34;
      if (ready(sprites.basket)) {
        ctx.drawImage(sprites.basket, basket.x - 8, by - 8, basket.w + 16, 38);
      } else {
        ctx.fillStyle = "#1f6feb";
        ctx.fillRect(basket.x, by, basket.w, basket.h);
        ctx.fillRect(basket.x - 4, by, 4, basket.h + 6);
        ctx.fillRect(basket.x + basket.w, by, 4, basket.h + 6);
      }

      // bomb-hit flash overlay
      if (flash > 0) {
        ctx.fillStyle = `rgba(228, 87, 46, ${flash / 24})`;
        ctx.fillRect(0, 0, W, H);
      }

      // HUD
      ctx.fillStyle = "#1c2541";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`🪙 ${coins}`, 12, 26);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.ceil(remaining / 1000)}s`, W - 12, 26);
      ctx.textAlign = "left";
    }

    function loop(now) {
      const elapsed = now - startTime;
      const remaining = ROUND_MS - elapsed;
      if (flash > 0) flash -= 1;

      if (now - lastSpawn > 620) {
        spawn();
        lastSpawn = now;
      }

      const by = H - 34;
      for (const d of drops) d.y += d.vy;

      // collisions with basket
      drops = drops.filter((d) => {
        const caught =
          d.y + d.r >= by &&
          d.y - d.r <= by + basket.h &&
          d.x >= basket.x - 6 &&
          d.x <= basket.x + basket.w + 6;
        if (caught) {
          if (d.bomb) {
            coins = Math.max(0, coins - 3);
            flash = 8;
            if (FX) {
              FX.sound("pop");
              FX.shake(api.stage(), 8, 300);
              FX.haptic([0, 30]);
            }
          } else {
            coins += 1;
            if (FX) {
              const v = toViewport(d.x, by);
              FX.burst({
                x: v.x, y: v.y,
                shape: "coin",
                colors: ["#f6c945", "#ffd56b", "#fff5cf"],
                count: 8, speed: 5, lifeMs: 600,
              });
              FX.sound("coin");
              FX.haptic(10);
            }
          }
          return false;
        }
        return d.y - d.r < H; // drop off-screen items
      });

      draw(remaining);

      if (remaining <= 0) {
        finish();
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function finish() {
      running = false;
      cancelAnimationFrame(raf);
      const stars = coins >= 18 ? 2 : coins >= 9 ? 1 : 0;
      let summary = "Coin Dash";
      if (FX) {
        const { isNewBest } = FX.highScore("coin-dash", coins);
        if (isNewBest && coins > 0) summary = "Coin Dash — NEW BEST! 🏆";
      }
      statusEl.textContent = `Round over — ${coins} coins caught!`;
      api.finish({ coins, stars, summary });
    }

    function start() {
      if (running) return;
      running = true;
      coins = 0;
      drops = [];
      startBtn.style.display = "none";
      statusEl.textContent = "Go! 🪙";
      startTime = performance.now();
      lastSpawn = startTime;
      // Don't start a round we can't finish.
      raf = requestAnimationFrame(loop);
    }

    startBtn.addEventListener("click", start);
    draw(ROUND_MS);

    return {
      destroy() {
        running = false;
        cancelAnimationFrame(raf);
        canvas.removeEventListener("mousemove", onMove);
        window.removeEventListener("keydown", onKey);
      },
    };
  },
});
