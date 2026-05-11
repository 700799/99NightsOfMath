# NPC Interaction System

## Overview
Design agents for NPCs that dynamically interact with players to guide, encourage, and help solve math challenges.

## Core Features
1. **Dynamic Dialogues**:
   - Owl NPC provides personalized hints based on the problem and player progress.
   - Encourages players when struggling.
2. **Event-Driven Interaction**:
   - Clicking on the Owl triggers new dialogue options or hints.
3. **Hint Trees**:
   - Hints change based on:
     - Problem type.
     - Player performance.
     - Level progression.

## Example Scenarios
### Hint Tree Dialog
1. **Player Starts Problem**:
   - Owl: "Hoot! Ready to solve this one? Look closely at the fractions."
2. **Player Struggles**:
   - Owl: "Hint: Try finding the common denominator first."
3. **Player Solves Problem**:
   - Owl: "Excellent! Let me light up the next path for you."

## Tasks
- Define a decision tree for Owl NPC behavior.
- Implement API to fetch hint data dynamically.
- Connect NPC hints to real-time problem-solving progress.