# Reward Breaks & Work/Play Ratio

## Objective
Keep students motivated during long study sessions by rewarding focused work
with short, fun mini-games — a deliberate **mental break**, not an open-ended
distraction.

## The ratio
- **Default:** 30 minutes of focus → 5 minutes of play.
- The ratio is a **global, server-persisted** setting (`data/rewardConfig.json`),
  so it survives restarts and applies to every student's next session.
- Admins manage it from `/admin.html` or the API. Guard rails keep values sane
  (focus `0.25–240` min, play `0.25–60` min), and a 30s/30s demo preset makes it
  easy to see a break without waiting half an hour.

## How focus is tracked
- The focus timer accrues only while the tab is **visible** and no break is
  running (via the Page Visibility API), so the "30 minutes" reflects real
  focused time.
- Progress and earnings (coins ⭐ stars) persist per day in `localStorage`.
- When accrued focus reaches the goal, the arcade overlay opens for the
  configured play duration, then resets the focus meter.

## The reward arcade
A small, pluggable arcade engine (`public/js/arcade.js`) runs a timed break and
hosts the mini-games. Each game is a self-contained module under
`public/js/games/` that registers itself and reports coins/stars when a round
ends.

| Game | Skill | Idea |
| ---- | ----- | ---- |
| Coin Dash | Reflexes | Catch falling coins, dodge bombs |
| Memory Match | Memory | Match all eight pairs against the clock |
| Reaction Rush | Timing | Wait for the star, then tap fast (best of 3) |
| Dice Duel | Luck | Roll higher than the CPU, best of 3 |
| Balloon Pump | Nerve | Pump for coins, bank before it pops |

### Adding a new mini-game
1. Add its metadata to `utils/rewardGames.js` (the shared catalog).
2. Create `public/js/games/<id>.js` that calls `Arcade.register({ ... })` with a
   matching `id` and a `mount(root, api)` function.
3. In `mount`, render into `root`, run one round, then call
   `api.finish({ coins, stars, summary })`. Return `{ destroy() }` to clean up
   timers/animation frames if the break ends mid-game.
4. Add a `<script>` tag for it in `public/play.html` (after `arcade.js`).

## Graphics & "juice"
The arcade uses original SVG sprite art (`public/assets/sprites/`, catalogued in
`public/js/fx-manifest.js`) and a self-hosted OFL display font
(`public/assets/fonts/`). All visual/audio polish lives in one shared module,
`public/js/fx.js` (`window.Fx`), which `arcade.js` exposes to every game as
`api.fx`:

- `Fx.burst({x,y,shape,colors,count,…})` / `Fx.burstAt(el, …)` — localized
  particle bursts (coin/star/spark) on a single shared canvas + one self-ending
  rAF loop. `Fx.confetti()` is the full-screen preset (`api.confetti` delegates
  to it).
- `Fx.shake(el, intensity, ms)` — screen shake; always target `api.stage()`,
  never a sprite the game transforms itself.
- `Fx.sound(name[, level])` — WebAudio-synthesized cues (`coin, match, pop, win,
  error, tick, pump`); no audio files. The AudioContext unlocks on the first
  user gesture; a persisted 🔊/🔇 toggle lives in the arcade bar.
- `Fx.haptic(pattern)` — `navigator.vibrate` wrapper (no-op where unsupported).
- `Fx.highScore(id, value)` / `Fx.bestTime(id, ms)` — per-game bests driving the
  "new best!" flourishes.
- `Fx.sprite(id)` / `Fx.preload(ids)` — cached `Image` objects for the Canvas
  game (Coin Dash); DOM games reference sprite paths from `window.FxAssets`.

Accessibility: `prefers-reduced-motion` suppresses shake and heavy animation
(keeping end-states) and trims particle counts; audio is controlled
independently by the mute toggle. To add art for a new game, drop the `.svg`
into `public/assets/sprites/`, register its path in `fx-manifest.js`, and the
asset test will assert it exists.

## API
| Method | Endpoint | Auth | Purpose |
| ------ | -------- | ---- | ------- |
| `GET`  | `/api/reward/config` | — | Current ratio + limits + label |
| `GET`  | `/api/reward/games`  | — | Mini-game catalog |
| `POST` | `/api/reward/config` | `x-admin-key` | Update the ratio |

Set the admin key with the `ADMIN_KEY` environment variable. The local-dev
default is `99nights-admin`, and the server logs a warning when it's in use.

## Testing
Run `npm test` (Node's built-in runner — no extra dependencies):

- `test/reward.test.js` — unit tests for the config validation/persistence, the
  game catalog, and the math generators' correctness invariants (fractions in
  lowest terms, ratios reduced, geometry area, true median, etc.).
- `test/routes.test.js` — HTTP integration tests for the reward-config endpoints
  (including admin-key auth and out-of-range rejection), the game catalog, and
  the practice/problems endpoints. It boots the app on an ephemeral port and
  snapshots/restores any on-disk config so it never clobbers real settings.

Because the routes test imports the app, `server.js` only calls `listen()` when
run directly (`require.main === module`).

## Tasks / future ideas
- Per-student accounts so progress and the wallet sync across devices.
- Teacher dashboard showing focus minutes and breaks earned per student.
- More mini-games (rhythm tap, maze sprint, target shooter).
- Optionally tie break eligibility to problems solved as well as time.
