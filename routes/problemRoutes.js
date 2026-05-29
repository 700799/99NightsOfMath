const express = require("express");
const { 
  generateFractionProblem, 
  generateAlgebraProblem, 
  generateRatioProblem, 
  generateGeometryProblem, 
  generateStatisticsProblem 
} = require("../utils/mathProblemGenerator");

const router = express.Router();

// Tracking current level
let level = 1;

const getQuestionsForLevel = (level) => {
  const levels = {
    1: [generateFractionProblem(), generateAlgebraProblem()],
    2: [generateRatioProblem(), generateGeometryProblem()],
    3: [generateStatisticsProblem()],
  };
  return levels[level] || [];
};

// API endpoint to fetch math problems by level
router.get("/problems", (req, res) => {
  const problems = getQuestionsForLevel(level);
  res.json(problems);
});

// Single random problem drawn from every topic — powers the mixed "focus"
// practice loop so a long study session stays varied.
const allGenerators = [
  generateFractionProblem,
  generateAlgebraProblem,
  generateRatioProblem,
  generateGeometryProblem,
  generateStatisticsProblem,
];
const topicLabels = ["Fractions", "Algebra", "Ratios", "Geometry", "Statistics"];

router.get("/practice", (req, res) => {
  const i = Math.floor(Math.random() * allGenerators.length);
  res.json({ ...allGenerators[i](), topic: topicLabels[i] });
});

// API endpoint to increase level (placeholder logic for now)
router.post("/next-level", (req, res) => {
  level = Math.min(level + 1, 3); // Max level = 3
  res.json({ success: true, nextLevel: level });
});

module.exports = router;
