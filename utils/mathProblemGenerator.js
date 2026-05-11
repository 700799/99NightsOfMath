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

const generateRatioProblem = () => {
  return {
    question: "If there are 12 apples and 8 bananas, what is the ratio of apples to bananas?",
    hint: "Divide both numbers by their greatest common factor.",
    answer: "3:2",
  };
};

const generateGeometryProblem = () => {
  return {
    question: "What is the area of a rectangle 5 units wide and 7 units long?",
    hint: "Use the formula: area = width × length.",
    answer: "35 sq. units",
  };
};

const generateStatisticsProblem = () => {
  return {
    question: "What is the median of the numbers 3, 7, 9, 15, 17?",
    hint: "The median is the middle number in an ordered list.",
    answer: "9",
  };
};

module.exports = { 
  generateFractionProblem, 
  generateAlgebraProblem, 
  generateRatioProblem, 
  generateGeometryProblem, 
  generateStatisticsProblem 
};