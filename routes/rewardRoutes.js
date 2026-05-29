const express = require("express");
const {
  readConfig,
  writeConfig,
  LIMITS,
  DEFAULT_CONFIG,
  ratioLabel,
} = require("../utils/rewardConfig");
const { listGames } = require("../utils/rewardGames");

const router = express.Router();

// Admin key gates ratio changes. Override in production via the ADMIN_KEY env
// var. Using the built-in default is fine for local/classroom use but is
// logged as a warning on startup (see server.js).
const ADMIN_KEY = process.env.ADMIN_KEY || "99nights-admin";

function isAuthorized(req) {
  const provided = req.get("x-admin-key") || (req.body && req.body.adminKey);
  return provided === ADMIN_KEY;
}

// Public: current work/play ratio plus the editable limits and defaults.
router.get("/reward/config", (req, res) => {
  res.json({
    ...readConfig(),
    limits: LIMITS,
    defaults: DEFAULT_CONFIG,
    label: ratioLabel(),
  });
});

// Public: catalog of available reward mini-games.
router.get("/reward/games", (req, res) => {
  res.json(listGames());
});

// Admin: update the work/play ratio. Requires the admin key.
router.post("/reward/config", (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Invalid or missing admin key." });
  }

  const { adminKey, ...updates } = req.body || {};
  const { config, errors } = writeConfig(updates);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  res.json({ ...config, label: ratioLabel(config) });
});

module.exports = router;
