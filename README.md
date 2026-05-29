# 99 Nights of Common Core Math

Welcome to *99 Nights of Math*, an immersive educational game designed to help students master 6th-grade Common Core math. Solve problems, explore a mysterious forest, and discover secrets while improving your skills!

## Features
- **Interactive Gameplay**: Navigate a forest filled with NPCs who provide guidance and challenges.
- **6th-Grade Math Practice**: Algebra, fractions, ratios, geometry, and statistics.
- **Hints & Explanations**: Step-by-step solutions and logical hints.
- **Level Progression**: Unlock new areas and challenges with your math skills.
- **🎉 Reward Breaks**: Focused study earns short Mario-Party-style mini-games as a mental reset. The default ratio is **30 minutes of focus → 5 minutes of play**, and it's fully admin-configurable.

## Focus &amp; Play (reward breaks)
Open `/play.html` to start a focus session. A progress bar fills as you stay
focused (the timer pauses when you switch away from the tab). When you reach the
focus goal, a **play break** unlocks: a timed arcade of mini-games — Coin Dash,
Memory Match, Reaction Rush, Dice Duel, and Balloon Pump — where you bank coins
and stars. When the break timer runs out, you're back to practice, recharged.

The arcade ships with original SVG sprite art, a self-hosted display font, and
full "juice" — particle bursts, screen shake, WebAudio sound effects (with a
🔊/🔇 toggle), haptics, and victory flourishes. It respects
`prefers-reduced-motion`, and the build stays dependency-free with no build step.
See [Reward Breaks](docs/reward-breaks.md) for the graphics/FX architecture.

### Managing the work/play ratio
The ratio is a global, server-persisted setting that admins control at
`/admin.html`:

- Default: **30 min focus → 5 min play**.
- Adjust focus/play minutes (presets included, plus a 30s/30s demo preset for
  quick testing).
- Saving requires the **admin key**. Set it with the `ADMIN_KEY` environment
  variable; the local-dev default is `99nights-admin` (a startup warning is
  logged when the default is in use).

The same settings are available over the API:

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| `GET`  | `/api/reward/config` | Current ratio, limits, defaults, label |
| `GET`  | `/api/reward/games`  | Catalog of reward mini-games |
| `POST` | `/api/reward/config` | Update ratio (requires `x-admin-key` header) |
| `GET`  | `/api/practice`      | One random problem across all topics |

## Testing
```bash
npm test   # runs the Node built-in test runner (no extra dependencies)
```

## Tech Stack
- **Frontend**: Vanilla JS + HTML5 Canvas, served as static files (no build step).
- **Backend**: Node.js, Express, Socket.IO.
- **Persistence**: JSON file for admin settings today; MongoDB/PostgreSQL planned for user accounts and leaderboards.

## Roadmap
1. Add starter questions for fraction and ratio practice. ✅
2. Design forest map with NPC interactions.
3. Implement progressive difficulty and rewards. ✅ — see [Focus & Play reward breaks](docs/reward-breaks.md).

---

## Getting Started
- Clone the repo: `git clone https://github.com/700799/99NightsOfMath.git`
- Install dependencies:
  ```bash
  npm install
  ```
- Run the app:
  ```bash
  npm start
  ```