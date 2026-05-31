/* ===========================================================================
   Fx — shared "juice" toolbox for the reward arcade.
   Particles, screen shake, WebAudio sound (no audio files), haptics, a
   high-score store, sprite preloading, and prefers-reduced-motion handling.
   Loaded before arcade.js + games; consumed via the per-game `api.fx`.
   =========================================================================== */
(function () {
  "use strict";

  const PALETTE = ["#f6c945", "#1f6feb", "#2bb673", "#e4572e", "#7c5cff", "#ff5c8a"];
  const STORE_KEY = "nnm_fx";

  // ---- Persisted settings + high scores ----------------------------------
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  const store = load();
  if (!store.best) store.best = {};
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) {
      /* storage may be unavailable */
    }
  }

  // ---- Reduced motion -----------------------------------------------------
  const rmQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener: null };
  let reduced = rmQuery.matches;
  if (rmQuery.addEventListener) {
    rmQuery.addEventListener("change", (e) => (reduced = e.matches));
  }
  const reducedMotion = () => reduced;

  // ---- Particle system (single shared canvas, one rAF loop) ---------------
  let canvas = null;
  let ctx = null;
  let rafId = null;
  let last = 0;
  const particles = [];

  function fit() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.getElementById("confettiCanvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "confettiCanvas";
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext("2d");
    fit();
    window.addEventListener("resize", fit);
  }

  function drawStar(size) {
    const spikes = 5;
    const outer = size;
    const inner = size * 0.45;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / spikes) * i - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === "coin") {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (p.shape === "star") {
      drawStar(p.size);
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
    }
    ctx.restore();
  }

  function loop(now) {
    const dt = Math.min(40, now - last);
    last = now;
    const k = dt / 16.7;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.vy += p.gravity * k;
      p.rot += p.vr * k;
      p.life -= dt;
      if (p.life <= 0 || p.y > canvas.height + 60) {
        particles.splice(i, 1);
        continue;
      }
      drawParticle(p);
    }
    if (particles.length) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  function ensureLoop() {
    if (rafId == null) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  }

  // Localized burst. Origin x/y are viewport coords (canvas == viewport).
  function burst(opts) {
    ensureCanvas();
    opts = opts || {};
    let count = opts.count != null ? opts.count : 22;
    let lifeMs = opts.lifeMs != null ? opts.lifeMs : 850;
    if (reduced) {
      count = Math.min(count, 6);
      lifeMs = Math.min(lifeMs, 450);
    }
    const x = opts.x != null ? opts.x : window.innerWidth / 2;
    const y = opts.y != null ? opts.y : window.innerHeight / 2;
    const colors = opts.colors || PALETTE;
    const shape = opts.shape || "spark";
    const spread = opts.spread != null ? opts.spread : Math.PI * 2;
    const angle = opts.angle != null ? opts.angle : -Math.PI / 2;
    const speed = opts.speed != null ? opts.speed : 6;
    const gravity = opts.gravity != null ? opts.gravity : 0.22;

    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const sp = speed * (0.4 + Math.random() * 0.9);
      particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        size: (opts.size || 6) * (0.7 + Math.random() * 0.7),
        color: colors[(Math.random() * colors.length) | 0],
        shape,
        gravity,
        life: lifeMs,
        maxLife: lifeMs,
      });
    }
    ensureLoop();
  }

  // Full-screen celebratory rain (back-compat for arcade.confetti).
  function confetti(durationMs) {
    ensureCanvas();
    const dur = durationMs || 1600;
    const n = reduced ? 28 : 130;
    for (let i = 0; i < n; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        size: 5 + Math.random() * 6,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        shape: Math.random() < 0.3 ? "star" : "rect",
        gravity: 0.05,
        life: dur,
        maxLife: dur,
      });
    }
    ensureLoop();
  }

  // ---- Screen shake -------------------------------------------------------
  const shaking = new Map();
  function shake(el, intensity, ms) {
    if (!el || reduced) return;
    intensity = intensity || 8;
    ms = ms || 320;
    if (shaking.has(el)) {
      const s = shaking.get(el);
      cancelAnimationFrame(s.raf);
      el.style.transform = s.prev;
      shaking.delete(el);
    }
    const prev = el.style.transform || "";
    const start = performance.now();
    function frame(now) {
      const t = (now - start) / ms;
      if (t >= 1) {
        el.style.transform = prev;
        shaking.delete(el);
        return;
      }
      const decay = (1 - t) * intensity;
      const dx = (Math.random() * 2 - 1) * decay;
      const dy = (Math.random() * 2 - 1) * decay;
      el.style.transform = `${prev} translate(${dx}px, ${dy}px)`;
      shaking.set(el, { raf: requestAnimationFrame(frame), prev });
    }
    shaking.set(el, { raf: requestAnimationFrame(frame), prev });
  }

  // ---- Sound (WebAudio synth, no files) -----------------------------------
  let actx = null;
  let master = null;
  function initAudio() {
    if (actx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      actx = new AC();
      master = actx.createGain();
      master.gain.value = isMuted() ? 0 : 0.45;
      master.connect(actx.destination);
    } catch (e) {
      actx = null;
    }
  }
  function unlock() {
    initAudio();
    if (actx && actx.state === "suspended") actx.resume();
  }
  // The first in-break gesture (clicking a game card) unlocks audio.
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    document.addEventListener(ev, unlock, { passive: true })
  );

  function tone(o) {
    if (!actx || isMuted()) return;
    const t0 = actx.currentTime + (o.delay || 0);
    const dur = o.dur || 0.12;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = o.type || "triangle";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.peak || 0.4, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }
  function noise(dur, peak) {
    if (!actx || isMuted()) return;
    dur = dur || 0.18;
    const n = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, n, actx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const g = actx.createGain();
    g.gain.value = peak || 0.5;
    const lp = actx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1800, actx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(280, actx.currentTime + dur);
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    src.start();
    src.stop(actx.currentTime + dur);
    src.onended = () => {
      src.disconnect();
      lp.disconnect();
      g.disconnect();
    };
  }

  function sound(name, level) {
    if (!actx || isMuted()) return;
    switch (name) {
      case "coin":
        tone({ freq: 880, slideTo: 1320, dur: 0.09, type: "triangle", peak: 0.4 });
        break;
      case "match":
        tone({ freq: 660, dur: 0.1, peak: 0.35 });
        tone({ freq: 880, dur: 0.12, peak: 0.35, delay: 0.09 });
        break;
      case "pop":
        noise(0.18, 0.5);
        tone({ freq: 320, slideTo: 80, dur: 0.12, type: "square", peak: 0.35 });
        break;
      case "win":
        [523, 659, 784, 1047].forEach((f, i) =>
          tone({ freq: f, dur: 0.16, type: "triangle", peak: 0.4, delay: i * 0.08 })
        );
        break;
      case "error":
        tone({ freq: 160, dur: 0.2, type: "square", peak: 0.4 });
        break;
      case "tick":
        tone({ freq: 1200, dur: 0.03, type: "square", peak: 0.2 });
        break;
      case "pump": {
        const lv = level || 1;
        tone({ freq: 280 + lv * 35, slideTo: 380 + lv * 55, dur: 0.07, type: "sine", peak: 0.3 });
        break;
      }
      default:
        break;
    }
  }

  // ---- Haptics ------------------------------------------------------------
  function haptic(pattern) {
    if (reduced) return; // vibration is a motion effect
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        /* ignore */
      }
    }
  }

  // ---- Mute ---------------------------------------------------------------
  function isMuted() {
    return !!store.muted;
  }
  function setMuted(v) {
    store.muted = !!v;
    save();
    if (master) master.gain.value = store.muted ? 0 : 0.45;
  }
  function toggleMuted() {
    setMuted(!isMuted());
    return isMuted();
  }

  // ---- High scores --------------------------------------------------------
  function highScore(gameId, value) {
    const prev = store.best[gameId];
    const isNewBest = prev == null || value > prev;
    if (isNewBest) {
      store.best[gameId] = value;
      save();
    }
    return { best: store.best[gameId], isNewBest };
  }
  function bestTime(gameId, ms) {
    const prev = store.best[gameId];
    const isNewBest = prev == null || ms < prev;
    if (isNewBest) {
      store.best[gameId] = ms;
      save();
    }
    return { best: store.best[gameId], isNewBest };
  }

  // ---- Sprites ------------------------------------------------------------
  const imgCache = new Map();
  function resolvePath(id) {
    if (window.FxAssets && window.FxAssets.sprites[id]) return window.FxAssets.sprites[id];
    return id; // allow passing a raw path
  }
  function sprite(id) {
    if (imgCache.has(id)) return imgCache.get(id);
    const img = new Image();
    img.src = resolvePath(id);
    imgCache.set(id, img);
    return img;
  }
  function preload(ids) {
    return Promise.all(
      (ids || []).map(
        (id) =>
          new Promise((res) => {
            const img = sprite(id);
            if (img.complete && img.naturalWidth) return res(img);
            img.onload = () => res(img);
            img.onerror = () => res(img); // resolve anyway; caller falls back
          })
      )
    );
  }

  // Convenience: viewport-coords burst centered on an element.
  function burstAt(el, opts) {
    if (!el) return burst(opts);
    const r = el.getBoundingClientRect();
    burst(Object.assign({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, opts || {}));
  }

  window.Fx = {
    burst,
    burstAt,
    confetti,
    shake,
    sound,
    tone,
    haptic,
    isMuted,
    setMuted,
    toggleMuted,
    highScore,
    bestTime,
    reducedMotion,
    sprite,
    preload,
    PALETTE,
  };
})();
