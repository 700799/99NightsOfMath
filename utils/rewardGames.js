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
];

function listGames() {
  return GAMES.map((g) => ({ ...g }));
}

function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}

module.exports = { GAMES, listGames, getGame };
