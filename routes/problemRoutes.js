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

// API endpoint to increase level (placeholder logic for now)
router.post("/next-level", (req, res) => {
  level = Math.min(level + 1, 3); // Max level = 3
  res.json({ success: true, nextLevel: level });
});

module.exports = router;
