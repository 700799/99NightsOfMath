# Skills and Agents in Claude

## Overview
Utilize Claude or other AI agents to assist in building functionality for "99 Nights of Math".

## Core Skills for Agents
1. **Dynamic Math Problem Generation** *(implemented)*:
   - Flexible generators produce randomized problems across topics (fractions,
     algebra, ratios, geometry, statistics) with computed, verified answers.
   - Next: fine-tune difficulty settings based on user levels.

2. **Backend Logic Generation**:
   - Build endpoints like `GET /api/problems`, `POST /api/next-level`,
     `GET /api/practice`, and the reward-config endpoints.
   - Implement level-tracking systems.

3. **Frontend Interactions**:
   - Guide Claude to create customizable components for quizzes and dialogues.
   - Suggest UI/UX best practices for user engagement.

4. **Reward Arcade & Pacing** *(implemented)*:
   - A pluggable arcade engine runs timed reward breaks; each mini-game is a
     self-contained module that registers itself and reports coins/stars.
   - An admin-configurable work/play ratio gates breaks. See
     [Reward Breaks](reward-breaks.md) for the game contract and how to add a
     new mini-game.

## Markdown Guidance for Claude
Use Markdown files to:
- Clearly define modules to be built.
- Specify inputs/outputs for each agent skill.
- Track iterative updates (e.g., "add hint interactivity").

## Tasks
- Use Claude to expand on APIs and problem engines for advanced challenges.
- Guide Claude in adding adaptive features for NPC suggestions.