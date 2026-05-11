const express = require("express");
const { generateFractionProblem, generateAlgebraProblem } = require("./utils/mathProblemGenerator");
const router = express.Router();

// API endpoint to fetch math problems
router.get("/problems", (req, res) => {
  const problems = [
    generateFractionProblem(),
    generateAlgebraProblem(),
  ];
  res.json(problems);
});

module.exports = router;
