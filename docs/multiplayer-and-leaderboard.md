# Multiplayer and Leaderboard System

## Objective
Develop a competitive and social feature for players to compete or collaborate.

## Features
### Multiplayer
1. **Real-Time Quizzes**:
   - Players solve the same math problems simultaneously.
   - First correct answer gets bonus points.
2. **Collaboration Mode**:
   - Players can team up to solve higher-level problems.

### Leaderboard
1. **Scoring**:
   - Points awarded based on:
     - Correctness.
     - Speed of answering.
   - Bonus for streaks and milestones.
   - **Reward-break currency**: coins 🪙 and stars ⭐ earned in the mini-game
     breaks (see [Reward Breaks](reward-breaks.md)) are a natural,
     already-tracked input for a "most coins this week" board. Today they
     persist per-day in `localStorage`; moving them server-side enables global
     rankings.
2. **Persistence**:
   - Save leaderboards in a database.
   - Display global and local rankings.

## Tasks
- Implement real-time multiplayer using Socket.IO.
- Create backend endpoints for retrieving and storing leaderboard data.
- Design a frontend leaderboard UI.
- Persist the reward-break wallet (coins/stars) server-side so it can feed the
  leaderboard across devices.