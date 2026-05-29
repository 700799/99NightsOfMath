# Level Agents for 99 Nights of Math

## Objective
Define logic for level progression and adaptive challenges.

## Core Features
- **Levels**:
  1. Fractions and simple algebra.
  2. Ratios and geometry.
  3. Statistics and advanced reasoning.
- **Progression**:
  - Players advance levels after completing a predefined number of correct answers.
  - Difficulty scales based on performance.

## API Requirements
### Endpoints:
1. **`GET /api/problems`**:
   - Fetches problems based on current level.
   - Dynamic adjustment of difficulty within a level.
2. **`POST /api/next-level`**:
   - Moves player to the next level.
   - Returns confirmation of new level.
3. **`GET /api/practice`**:
   - Returns a single, freshly randomized problem drawn from **all** topics
     (fractions, algebra, ratios, geometry, statistics), each tagged with its
     `topic`.
   - Powers the mixed-practice "focus" loop so long study sessions stay varied.

## Focus Time → Reward Breaks
Progression is paced by a work/play ratio in addition to level unlocks. As a
student practices, focused time accrues toward a goal (default 30 minutes); on
reaching it, a timed reward break unlocks. The ratio is admin-configurable via
`GET`/`POST /api/reward/config`. See [Reward Breaks](reward-breaks.md).

## Example Workflow
1. User starts at Level 1.
2. Completes 5 problems with a success rate > 70%.
3. Server advances the user to Level 2 and updates available problems.

## Tasks
- Implement the backend logic for generating and delivering level-specific problems.
- Track user's completion and success rate for dynamic progression.