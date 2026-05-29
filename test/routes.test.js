// Integration tests for the HTTP API: reward config (incl. admin auth),
// the mini-game catalog, and the math endpoints.
//
// A known admin key is set before requiring the app so the protected endpoint
// is deterministic regardless of the environment.
process.env.ADMIN_KEY = "test-admin-key";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const http = require("http");

const { app } = require("../server");
const { CONFIG_PATH } = require("../utils/rewardConfig");

let server;
let base;
let existed;
let backup;

async function api(method, path, { key, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (key) headers["x-admin-key"] = key;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    /* some responses (none here) may be empty */
  }
  return { status: res.status, json };
}

describe("HTTP API", () => {
  before(async () => {
    // Snapshot any persisted config and start from defaults.
    existed = fs.existsSync(CONFIG_PATH);
    backup = existed ? fs.readFileSync(CONFIG_PATH) : null;
    if (existed) fs.unlinkSync(CONFIG_PATH);

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    // Restore the original on-disk config state.
    if (existed) fs.writeFileSync(CONFIG_PATH, backup);
    else if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
  });

  it("GET /api/reward/config returns defaults, limits, and a label", async () => {
    const { status, json } = await api("GET", "/api/reward/config");
    assert.strictEqual(status, 200);
    assert.strictEqual(json.defaults.workMinutes, 30);
    assert.strictEqual(json.defaults.playMinutes, 5);
    assert.ok(json.limits.workMinutes.max > json.limits.workMinutes.min);
    assert.match(json.label, /focus/);
    assert.strictEqual(typeof json.workMinutes, "number");
    assert.strictEqual(typeof json.playMinutes, "number");
  });

  it("GET /api/reward/games returns the full catalog", async () => {
    const { status, json } = await api("GET", "/api/reward/games");
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(json));
    assert.ok(json.length >= 5);
    for (const g of json) {
      assert.ok(g.id && g.name && g.emoji && g.blurb);
    }
  });

  it("GET /api/practice returns a problem tagged with a known topic", async () => {
    const topics = ["Fractions", "Algebra", "Ratios", "Geometry", "Statistics"];
    const { status, json } = await api("GET", "/api/practice");
    assert.strictEqual(status, 200);
    for (const field of ["question", "hint", "answer", "topic"]) {
      assert.ok(json[field], `missing ${field}`);
    }
    assert.ok(topics.includes(json.topic), `unexpected topic: ${json.topic}`);
  });

  it("GET /api/problems returns an array of problems", async () => {
    const { status, json } = await api("GET", "/api/problems");
    assert.strictEqual(status, 200);
    assert.ok(Array.isArray(json));
    assert.ok(json.length >= 1);
    assert.ok(json[0].question && json[0].answer);
  });

  it("POST /api/reward/config without a key is rejected (401)", async () => {
    const { status } = await api("POST", "/api/reward/config", { body: { workMinutes: 20 } });
    assert.strictEqual(status, 401);
  });

  it("POST /api/reward/config with a wrong key is rejected (401)", async () => {
    const { status } = await api("POST", "/api/reward/config", {
      key: "wrong-key",
      body: { workMinutes: 20 },
    });
    assert.strictEqual(status, 401);
  });

  it("POST /api/reward/config rejects out-of-range values (400)", async () => {
    const { status, json } = await api("POST", "/api/reward/config", {
      key: "test-admin-key",
      body: { workMinutes: 99999 },
    });
    assert.strictEqual(status, 400);
    assert.ok(Array.isArray(json.errors) && json.errors.length > 0);
  });

  it("POST /api/reward/config with a valid key updates and persists", async () => {
    const update = await api("POST", "/api/reward/config", {
      key: "test-admin-key",
      body: { workMinutes: 40, playMinutes: 8 },
    });
    assert.strictEqual(update.status, 200);
    assert.strictEqual(update.json.workMinutes, 40);
    assert.strictEqual(update.json.playMinutes, 8);

    // The change is reflected on the next read...
    const read = await api("GET", "/api/reward/config");
    assert.strictEqual(read.json.workMinutes, 40);
    assert.strictEqual(read.json.playMinutes, 8);

    // ...and was written to disk.
    assert.ok(fs.existsSync(CONFIG_PATH));
    const onDisk = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    assert.strictEqual(onDisk.workMinutes, 40);
  });

  it("POST /api/reward/config accepts a partial update without disturbing the other field", async () => {
    // playMinutes is 8 from the previous test; change only workMinutes.
    const update = await api("POST", "/api/reward/config", {
      key: "test-admin-key",
      body: { workMinutes: 30 },
    });
    assert.strictEqual(update.status, 200);
    assert.strictEqual(update.json.workMinutes, 30);
    assert.strictEqual(update.json.playMinutes, 8);
  });
});
