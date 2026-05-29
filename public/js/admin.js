/* Admin panel for the work/play ratio. Reads the current config, lets an admin
   adjust focus/play minutes (with presets), and saves via the protected
   POST /api/reward/config endpoint using the admin key. */
(function () {
  const el = (id) => document.getElementById(id);
  const workInput = el("workMinutes");
  const playInput = el("playMinutes");
  const keyInput = el("adminKey");
  const saveBtn = el("saveBtn");
  const msg = el("msg");
  const ratioNow = el("ratioNow");

  function fmtRatio(w, p) {
    return `${w} min focus → ${p} min play`;
  }

  function setMsg(text, kind) {
    msg.textContent = text;
    msg.className = "msg" + (kind ? " " + kind : "");
  }

  async function loadConfig() {
    try {
      const res = await fetch("/api/reward/config");
      const data = await res.json();
      workInput.value = data.workMinutes;
      playInput.value = data.playMinutes;
      ratioNow.textContent = "Current: " + (data.label || fmtRatio(data.workMinutes, data.playMinutes));
      if (data.limits) {
        el("workHint").textContent = `Allowed: ${data.limits.workMinutes.min}–${data.limits.workMinutes.max} min`;
        el("playHint").textContent = `Allowed: ${data.limits.playMinutes.min}–${data.limits.playMinutes.max} min`;
      }
    } catch (e) {
      ratioNow.textContent = "Could not load current ratio.";
    }
  }

  // Preset buttons.
  el("presets").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    workInput.value = btn.dataset.w;
    playInput.value = btn.dataset.p;
    setMsg("Preset loaded — review and Save.", "");
  });

  saveBtn.addEventListener("click", async () => {
    const adminKey = keyInput.value.trim();
    if (!adminKey) {
      setMsg("Enter the admin key to save.", "bad");
      return;
    }
    const payload = {
      workMinutes: Number(workInput.value),
      playMinutes: Number(playInput.value),
    };

    saveBtn.disabled = true;
    setMsg("Saving…", "");
    try {
      const res = await fetch("/api/reward/config", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const reason = data.errors ? data.errors.join(" ") : data.error || "Save failed.";
        setMsg("⚠ " + reason, "bad");
      } else {
        ratioNow.textContent = "Current: " + (data.label || fmtRatio(data.workMinutes, data.playMinutes));
        workInput.value = data.workMinutes;
        playInput.value = data.playMinutes;
        setMsg("✅ Saved! New ratio applies to every student's next session.", "good");
      }
    } catch (e) {
      setMsg("⚠ Network error — could not save.", "bad");
    } finally {
      saveBtn.disabled = false;
    }
  });

  loadConfig();
})();
