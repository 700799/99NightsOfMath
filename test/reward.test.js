const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");

const rewardConfig = require("../utils/rewardConfig");
const { listGames, getGame, GAMES } = require("../utils/rewardGames");
const gen = require("../utils/mathProblemGenerator");

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

// --------------------------------------------------------------------------
// rewardConfig: validation
// --------------------------------------------------------------------------
test("defaults are the requested 30/5 ratio", () => {
  assert.strictEqual(rewardConfig.DEFAULT_CONFIG.workMinutes, 30);
  assert.strictEqual(rewardConfig.DEFAULT_CONFIG.playMinutes, 5);
});

test("validateConfig accepts valid partial updates", () => {
  const { config, errors } = rewardConfig.validateConfig({ workMinutes: 25 });
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(config.workMinutes, 25);
  assert.ok(!("playMinutes" in config));
});

test("validateConfig coerces numeric strings", () => {
  const { config, errors } = rewardConfig.validateConfig({ playMinutes: "10" });
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(config.playMinutes, 10);
});

test("validateConfig rejects out-of-range values", () => {
  const tooBig = rewardConfig.validateConfig({ workMinutes: 5000 });
  assert.ok(tooBig.errors.length > 0);
  const tooSmall = rewardConfig.validateConfig({ playMinutes: 0 });
  assert.ok(tooSmall.errors.length > 0);
});

test("validateConfig rejects non-numeric and unknown input", () => {
  assert.ok(rewardConfig.validateConfig({ workMinutes: "abc" }).errors.length > 0);
  assert.ok(rewardConfig.validateConfig({ nope: 1 }).errors.length > 0);
  assert.ok(rewardConfig.validateConfig(null).errors.length > 0);
});

test("validateConfig rounds to quarter-minute granularity", () => {
  const { config } = rewardConfig.validateConfig({ workMinutes: 30.1 });
  assert.strictEqual(config.workMinutes, 30);
});

test("ratioLabel renders a readable summary", () => {
  const label = rewardConfig.ratioLabel({ workMinutes: 30, playMinutes: 5 });
  assert.match(label, /30 min focus/);
  assert.match(label, /5 min play/);
});

// writeConfig/readConfig disk roundtrip (restores prior state afterward).
test("writeConfig persists and readConfig reads it back", () => {
  const path = rewardConfig.CONFIG_PATH;
  const existed = fs.existsSync(path);
  const backup = existed ? fs.readFileSync(path) : null;
  try {
    const result = rewardConfig.writeConfig({ workMinutes: 12, playMinutes: 3 });
    assert.deepStrictEqual(result.errors, []);
    const read = rewardConfig.readConfig();
    assert.strictEqual(read.workMinutes, 12);
    assert.strictEqual(read.playMinutes, 3);

    // Invalid writes leave the stored config untouched.
    const bad = rewardConfig.writeConfig({ workMinutes: -7 });
    assert.ok(bad.errors.length > 0);
    assert.strictEqual(rewardConfig.readConfig().workMinutes, 12);
  } finally {
    if (existed) fs.writeFileSync(path, backup);
    else if (fs.existsSync(path)) fs.unlinkSync(path);
  }
});

// --------------------------------------------------------------------------
// rewardGames catalog
// --------------------------------------------------------------------------
test("game catalog has unique ids and required fields", () => {
  const games = listGames();
  assert.ok(games.length >= 5, "expected at least 5 reward games");
  const ids = new Set();
  for (const g of games) {
    for (const field of ["id", "name", "emoji", "color", "blurb", "skill"]) {
      assert.ok(g[field], `game ${g.id} missing ${field}`);
    }
    assert.ok(!ids.has(g.id), `duplicate id ${g.id}`);
    ids.add(g.id);
  }
  assert.strictEqual(getGame(GAMES[0].id).name, GAMES[0].name);
  assert.strictEqual(getGame("does-not-exist"), null);
});

test("every catalog game declares a positive round length", () => {
  for (const g of listGames()) {
    assert.strictEqual(typeof g.roundSeconds, "number");
    assert.ok(g.roundSeconds > 0, `${g.id} has a non-positive roundSeconds`);
  }
});

test("listGames returns defensive copies", () => {
  const games = listGames();
  games[0].name = "MUTATED";
  // The source catalog must be unaffected by mutating a returned copy.
  assert.notStrictEqual(listGames()[0].name, "MUTATED");
  assert.notStrictEqual(getGame(GAMES[0].id).name, "MUTATED");
});

// --------------------------------------------------------------------------
// math problem generators: shape + correctness invariants
// --------------------------------------------------------------------------
test("every generator returns a well-formed problem", () => {
  const generators = [
    gen.generateFractionProblem,
    gen.generateAlgebraProblem,
    gen.generateRatioProblem,
    gen.generateGeometryProblem,
    gen.generateStatisticsProblem,
  ];
  for (const make of generators) {
    for (let i = 0; i < 50; i++) {
      const p = make();
      for (const field of ["question", "hint", "answer"]) {
        assert.strictEqual(typeof p[field], "string");
        assert.ok(p[field].length > 0);
      }
    }
  }
});

test("fraction answers are in lowest terms", () => {
  for (let i = 0; i < 200; i++) {
    const ans = gen.generateFractionProblem().answer;
    assert.match(ans, /^\d+(\/\d+)?$/);
    if (ans.includes("/")) {
      const [n, d] = ans.split("/").map(Number);
      assert.ok(d > 1);
      assert.strictEqual(gcd(n, d), 1, `not reduced: ${ans}`);
    }
  }
});

test("algebra answers combine like terms correctly", () => {
  for (let i = 0; i < 200; i++) {
    const p = gen.generateAlgebraProblem();
    const m = p.question.match(/(\d+)x \+ (\d+)x/);
    assert.ok(m, `unexpected algebra question: ${p.question}`);
    const expected = Number(m[1]) + Number(m[2]);
    assert.strictEqual(p.answer, `${expected}x`);
  }
});

test("ratio answers are reduced and use a colon", () => {
  for (let i = 0; i < 200; i++) {
    const ans = gen.generateRatioProblem().answer;
    assert.match(ans, /^\d+:\d+$/);
    const [a, b] = ans.split(":").map(Number);
    assert.strictEqual(gcd(a, b), 1, `ratio not reduced: ${ans}`);
  }
});

test("geometry area equals width times length", () => {
  for (let i = 0; i < 200; i++) {
    const p = gen.generateGeometryProblem();
    const m = p.question.match(/(\d+) units wide and (\d+) units long/);
    assert.ok(m, `unexpected geometry question: ${p.question}`);
    assert.strictEqual(p.answer, String(Number(m[1]) * Number(m[2])));
  }
});

test("statistics answer is the true median", () => {
  for (let i = 0; i < 200; i++) {
    const p = gen.generateStatisticsProblem();
    const nums = p.question
      .replace(/[^0-9,]/g, "")
      .split(",")
      .filter(Boolean)
      .map(Number);
    const sorted = nums.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    assert.strictEqual(p.answer, String(median));
  }
});
