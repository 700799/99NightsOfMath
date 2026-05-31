// Smoke-checks the four new arcade mini-games: each file must parse, self-register
// with the expected id and a destroy() teardown, and appear in the server catalog.
// Read-only — no browser globals required.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

const NEW_GAMES = [
  { file: "public/js/games/moleBonk.js", id: "mole-bonk" },
  { file: "public/js/games/towerStack.js", id: "tower-stack" },
  { file: "public/js/games/echo.js", id: "echo" },
  { file: "public/js/games/starChase.js", id: "star-chase" },
];

for (const g of NEW_GAMES) {
  test(`${g.id} parses and self-registers`, () => {
    const abs = path.join(ROOT, g.file);
    assert.ok(fs.existsSync(abs), `missing ${g.file}`);
    try {
      // Clean NODE_OPTIONS so the parent runner's flags don't leak into the child.
      execFileSync("node", ["--check", abs], { stdio: "pipe", env: { ...process.env, NODE_OPTIONS: "" } });
    } catch (err) {
      assert.fail(`syntax error in ${g.file}:\n${err.stderr || err.message}`);
    }
    const src = fs.readFileSync(abs, "utf8");
    assert.match(src, /Arcade\.register\(/, `${g.file} must call Arcade.register(`);
    assert.match(src, new RegExp(`id:\\s*["']${g.id}["']`), `${g.file} must declare id "${g.id}"`);
    assert.match(src, /destroy\s*\(/, `${g.file} must return a destroy() handle`);
  });
}

test("every new game is wired into the server catalog", () => {
  const { GAMES } = require("../utils/rewardGames.js");
  const ids = GAMES.map((g) => g.id);
  for (const g of NEW_GAMES) {
    assert.ok(ids.includes(g.id), `utils/rewardGames.js is missing "${g.id}"`);
  }
});

test("every new game is loaded by play.html", () => {
  const html = fs.readFileSync(path.join(ROOT, "public/play.html"), "utf8");
  for (const g of NEW_GAMES) {
    assert.match(html, new RegExp(g.file.replace(/[/.]/g, "\\$&")), `play.html does not load ${g.file}`);
  }
});
