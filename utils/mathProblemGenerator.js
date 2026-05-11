// Placeholder functions for generating 6th-grade math problems
const generateFractionProblem = () => {
  return {
    question: "What is 3/4 + 2/3?",
    hint: "Find the least common denominator first.",
    answer: "17/12",
  };
};

const generateAlgebraProblem = () => {
  return {
    question: "Simplify: 5x + 7x",
    hint: "Combine like terms.",
    answer: "12x",
  };
};

module.exports = { generateFractionProblem, generateAlgebraProblem };