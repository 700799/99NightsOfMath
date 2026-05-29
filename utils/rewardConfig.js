// Reward-ratio configuration for the "focus then play" mental-break system.
//
// The game alternates between focused work (solving math problems) and short
// reward breaks (Mario-Party-style mini-games). The ratio between the two is
// admin-configurable and persisted to disk so it survives server restarts.
//
// Default: 30 minutes of focus earns a 5-minute play break.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const CONFIG_PATH = path.join(DATA_DIR, "rewardConfig.json");

const DEFAULT_CONFIG = {
  workMinutes: 30,
  playMinutes: 5,
};

// Sensible guard rails so an admin cannot lock students out (work = huge) or
// turn the app into an arcade (play = huge). Fractional values are allowed so
// the ratio is easy to demo without waiting half an hour.
const LIMITS = {
  workMinutes: { min: 0.25, max: 240 },
  playMinutes: { min: 0.25, max: 60 },
};

const FIELDS = Object.keys(DEFAULT_CONFIG);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToQuarter(value) {
  // Keep values tidy (quarter-minute granularity) to avoid float noise.
  return Math.round(value * 4) / 4;
}

// Validate an arbitrary input object against the known fields and limits.
// Returns { config, errors } where config contains only valid, clamped fields.
function validateConfig(input) {
  const config = {};
  const errors = [];

  if (input === null || typeof input !== "object") {
    return { config, errors: ["Body must be a JSON object."] };
  }

  for (const field of FIELDS) {
    if (!(field in input)) continue;

    const raw = input[field];
    const num = typeof raw === "string" ? Number(raw) : raw;

    if (typeof num !== "number" || !Number.isFinite(num)) {
      errors.push(`${field} must be a finite number.`);
      continue;
    }

    const { min, max } = LIMITS[field];
    if (num < min || num > max) {
      errors.push(`${field} must be between ${min} and ${max} minutes.`);
      continue;
    }

    config[field] = roundToQuarter(clamp(num, min, max));
  }

  if (errors.length === 0 && Object.keys(config).length === 0) {
    errors.push(`No recognized fields. Expected one of: ${FIELDS.join(", ")}.`);
  }

  return { config, errors };
}

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const { config } = validateConfig(parsed);
    // Merge over defaults so a partial/corrupt file still yields a full config.
    return { ...DEFAULT_CONFIG, ...config };
  } catch (err) {
    // Missing or unreadable file → fall back to defaults.
    return { ...DEFAULT_CONFIG };
  }
}

// Apply a partial update. Returns { config, errors }. When errors are present
// nothing is written and `config` reflects the unchanged on-disk values.
function writeConfig(partial) {
  const { config: updates, errors } = validateConfig(partial);
  const current = readConfig();

  if (errors.length > 0) {
    return { config: current, errors };
  }

  const next = { ...current, ...updates };

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  } catch (err) {
    return { config: current, errors: [`Could not persist config: ${err.message}`] };
  }

  return { config: next, errors: [] };
}

// Human-friendly summary, e.g. "30 min focus → 5 min play".
function ratioLabel(config = readConfig()) {
  const fmt = (m) => (Number.isInteger(m) ? `${m}` : `${m}`);
  return `${fmt(config.workMinutes)} min focus → ${fmt(config.playMinutes)} min play`;
}

module.exports = {
  DEFAULT_CONFIG,
  LIMITS,
  CONFIG_PATH,
  validateConfig,
  readConfig,
  writeConfig,
  ratioLabel,
};
