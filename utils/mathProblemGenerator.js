// Dynamic 6th-grade Common Core problem generators.
//
// Each generator returns { question, hint, answer } with a freshly randomized
// problem and a computed answer. Answers are returned in a compact, normalized
// form (no spaces, units folded into the question) so the client can check
// them with a simple normalize-and-compare.

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
};

// Reduce a fraction to lowest terms and format as "n/d" (or whole number).
const reduceFraction = (num, den) => {
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};

const generateFractionProblem = () => {
  const b = randInt(2, 8);
  let d = randInt(2, 8);
  while (d === b) d = randInt(2, 8); // different denominators keep it interesting
  const a = randInt(1, b - 1);
  const c = randInt(1, d - 1);

  const commonDen = b * d;
  const sumNum = a * d + c * b;

  return {
    question: `What is ${a}/${b} + ${c}/${d}? (write as a fraction in lowest terms)`,
    hint: `Find a common denominator (${b} × ${d} = ${commonDen}), add the numerators, then simplify.`,
    answer: reduceFraction(sumNum, commonDen),
  };
};

const generateAlgebraProblem = () => {
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  return {
    question: `Simplify the expression: ${a}x + ${b}x`,
    hint: "These are like terms — add their coefficients and keep the x.",
    answer: `${a + b}x`,
  };
};

const generateRatioProblem = () => {
  const items = [
    ["apples", "bananas"],
    ["cats", "dogs"],
    ["red marbles", "blue marbles"],
    ["stars", "moons"],
  ];
  const [first, second] = items[randInt(0, items.length - 1)];
  const x = randInt(2, 12);
  const y = randInt(2, 12);
  const g = gcd(x, y);

  return {
    question: `There are ${x} ${first} and ${y} ${second}. What is the ratio of ${first} to ${second} in simplest form? (use a colon, e.g. 3:2)`,
    hint: `Divide both numbers by their greatest common factor (${g}).`,
    answer: `${x / g}:${y / g}`,
  };
};

const generateGeometryProblem = () => {
  const w = randInt(2, 15);
  const l = randInt(2, 15);
  return {
    question: `A rectangle is ${w} units wide and ${l} units long. What is its area, in square units? (number only)`,
    hint: "Area of a rectangle = width × length.",
    answer: `${w * l}`,
  };
};

const generateStatisticsProblem = () => {
  // Build an odd-length sorted set so the median is a single middle value.
  const count = [5, 7][randInt(0, 1)];
  const values = [];
  let current = randInt(1, 5);
  for (let i = 0; i < count; i++) {
    current += randInt(1, 5);
    values.push(current);
  }
  const median = values[Math.floor(count / 2)];

  return {
    question: `Find the median of these numbers: ${values.join(", ")}. (number only)`,
    hint: "The median is the middle value once the numbers are in order.",
    answer: `${median}`,
  };
};

module.exports = {
  generateFractionProblem,
  generateAlgebraProblem,
  generateRatioProblem,
  generateGeometryProblem,
  generateStatisticsProblem,
};
