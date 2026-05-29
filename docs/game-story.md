# Game Story and Progression

## Objective
Integrate a compelling narrative to drive the player's journey through the math challenges.

## Narrative Structure
- The forest is under a mysterious spell, and solving math problems lifts the fog and restores balance.
- Each level unlocks a new part of the forest with its own story.

## Key Features
1. **Level-Based Progression**:
   - Level 1: "The Misty Clearing" (basic math challenges to clear the path).
   - Level 2: "The Enchanted River" (deepen reasoning with geometry).
   - Level 3: "The Hidden Glade" (master statistics to uncover the final secret).
2. **Narrative Hooks**:
   - NPCs reveal parts of the story after solving a series of problems.
3. **Campfire Rest (Reward Breaks)**:
   - After a stretch of focused work, the traveler reaches a safe campfire and
     earns a short play break — a set of Mario-Party-style mini-games framed as
     resting and recharging before the next leg of the journey.
   - This is a deliberate **mental break**: the default rhythm is 30 minutes of
     focus → 5 minutes of play, and the pacing is admin-configurable.
   - See [Reward Breaks](reward-breaks.md) for the full design.

## Tasks
- Add story elements to each level.
- Use Owl NPC to narrate progress.
- Incorporate visual map progression (e.g., opening pathways with solved problems).
- Tie the campfire/reward-break moment into each level's narrative (the Owl could
  invite the player to rest once they reach the focus goal).