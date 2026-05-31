// Catalog of the Mario-Party-style reward mini-games.
//
// This is the single source of truth for which games exist. The frontend
// arcade fetches it to render the game picker, and each id must match a game
// module registered on the client (public/js/games/<id>.js).

const GAMES = [
  {
    id: "coin-dash",
    name: "Coin Dash",
    emoji: "🪙",
    color: "#f6c945",
    blurb: "Catch the falling coins, dodge the bombs!",
    skill: "Reflexes",
    roundSeconds: 25,
  },
  {
    id: "memory-match",
    name: "Memory Match",
    emoji: "🧠",
    color: "#7c5cff",
    blurb: "Flip the cards and find every matching pair.",
    skill: "Memory",
    roundSeconds: 60,
  },
  {
    id: "reaction-rush",
    name: "Reaction Rush",
    emoji: "⚡",
    color: "#ff5c8a",
    blurb: "Wait for the star… then tap as fast as you can!",
    skill: "Timing",
    roundSeconds: 20,
  },
  {
    id: "dice-duel",
    name: "Dice Duel",
    emoji: "🎲",
    color: "#36c2a6",
    blurb: "Roll higher than the CPU across three rounds.",
    skill: "Luck",
    roundSeconds: 30,
  },
  {
    id: "balloon-pump",
    name: "Balloon Pump",
    emoji: "🎈",
    color: "#ff8a3d",
    blurb: "Mash the button to pump the biggest balloon — don't pop it!",
    skill: "Nerve",
    roundSeconds: 20,
  },
  {
    id: "mole-bonk",
    name: "Bonk!",
    emoji: "🔨",
    color: "#8a5c3a",
    blurb: "Bonk the moles, dodge the bombs — go fast!",
    skill: "Accuracy",
    roundSeconds: 25,
  },
  {
    id: "tower-stack",
    name: "Tower Stack",
    emoji: "🧱",
    color: "#2bb673",
    blurb: "Drop each block dead-center to build the tallest tower!",
    skill: "Precision",
    roundSeconds: 30,
  },
  {
    id: "echo",
    name: "Echo",
    emoji: "🎵",
    color: "#7c5cff",
    blurb: "Watch the pattern, then play it back. How long can you echo?",
    skill: "Memory",
    // Turn-based (ends on a mistake or at the max sequence); this is a nominal
    // estimate for a full run, not a hard timer the client enforces.
    roundSeconds: 45,
  },
  {
    id: "star-chase",
    name: "Star Chase",
    emoji: "⭐",
    color: "#f6c945",
    blurb: "Race the maze and grab every star before time runs out!",
    skill: "Navigation",
    roundSeconds: 30,
  },
];

function listGames() {
  return GAMES.map((g) => ({ ...g }));
}

function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}

module.exports = { GAMES, listGames, getGame };
