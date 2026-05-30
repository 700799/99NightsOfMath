// Guards the graphics upgrade: every sprite/font referenced by the manifest
// must exist on disk, and every new/edited client script must parse. Read-only.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

// Load the browser manifest by providing a minimal `window` global.
global.window = {};
require("../public/js/fx-manifest.js");
const assets = global.window.FxAssets;

test("manifest loaded with sprite + font sections", () => {
  assert.ok(assets, "FxAssets manifest did not load");
  assert.ok(assets.sprites && Object.keys(assets.sprites).length >= 15);
});

test("every manifest sprite file exists under public/", () => {
  for (const [id, rel] of Object.entries(assets.sprites)) {
    const file = path.join(PUBLIC, rel);
    assert.ok(fs.existsSync(file), `missing sprite "${id}" → ${rel}`);
    assert.ok(rel.endsWith(".svg"), `sprite "${id}" should be an .svg`);
  }
});

test("each manifest font exists and ships its OFL license", () => {
  const fonts = assets.fonts || {};
  for (const [id, rel] of Object.entries(fonts)) {
    const file = path.join(PUBLIC, rel);
    assert.ok(fs.existsSync(file), `missing font "${id}" → ${rel}`);
    // SIL OFL requires the license to travel with the font.
    const license = path.join(path.dirname(file), "OFL.txt");
    assert.ok(fs.existsSync(license), `missing OFL.txt next to ${rel}`);
  }
});

test("favicon exists and is linked from every HTML page", () => {
  assert.ok(fs.existsSync(path.join(PUBLIC, "favicon.svg")), "missing public/favicon.svg");
  for (const page of ["play.html", "index.html", "admin.html"]) {
    const html = fs.readFileSync(path.join(PUBLIC, page), "utf8");
    assert.match(html, /rel="icon"[^>]*favicon\.svg/, `${page} does not link favicon.svg`);
  }
});

test("sprite SVGs declare explicit width/height (needed for <canvas> drawImage)", () => {
  // Coin Dash draws these on a canvas; an SVG with no intrinsic size renders blank.
  for (const id of ["coin", "bomb", "basket"]) {
    const file = path.join(PUBLIC, assets.sprites[id]);
    const svg = fs.readFileSync(file, "utf8");
    assert.match(svg, /<svg[^>]*\bwidth=/, `${id}.svg missing width`);
    assert.match(svg, /<svg[^>]*\bheight=/, `${id}.svg missing height`);
  }
});

test("new/edited client scripts parse (node --check)", () => {
  const files = [
    "public/js/fx.js",
    "public/js/fx-manifest.js",
    "public/js/arcade.js",
    "public/js/focus.js",
    "public/js/games/coinDash.js",
    "public/js/games/memoryMatch.js",
    "public/js/games/reactionRush.js",
    "public/js/games/diceDuel.js",
    "public/js/games/balloonPump.js",
  ];
  for (const rel of files) {
    try {
      execFileSync("node", ["--check", path.join(ROOT, rel)], { stdio: "pipe" });
    } catch (err) {
      assert.fail(`syntax error in ${rel}:\n${err.stderr || err.message}`);
    }
  }
});
