const EPSILON = 1e-7;
const OPERATORS = ["+", "-", "*", "/"];

function combineValues(left, right, operator) {
  if (operator === "+") return left + right;
  if (operator === "-") return left - right;
  if (operator === "*") return left * right;
  if (operator === "/") {
    if (Math.abs(right) < EPSILON) {
      throw new Error("Division by zero is not allowed");
    }
    return left / right;
  }
  throw new Error(`Unsupported operator: ${operator}`);
}

function isTwentyFour(value) {
  return Math.abs(value - 24) < EPSILON;
}

function applyOperation(values, leftId, rightId, operator) {
  const left = values.find((entry) => entry.id === leftId);
  const right = values.find((entry) => entry.id === rightId);

  if (!left || !right) {
    throw new Error("Both selected values must exist");
  }

  if (left.id === right.id) {
    throw new Error("Select two different values");
  }

  const nextValue = combineValues(left.value, right.value, operator);
  const result = {
    id: `${left.id}+${right.id}`,
    value: nextValue,
    expression: `(${left.expression} ${operator} ${right.expression})`,
  };

  return values.filter((entry) => entry.id !== leftId && entry.id !== rightId).concat(result);
}

function canMakeTarget(numbers, target = 24) {
  const entries = numbers.map((number) => Number(number));

  function search(values) {
    if (values.length === 1) {
      return Math.abs(values[0] - target) < EPSILON;
    }

    for (let leftIndex = 0; leftIndex < values.length; leftIndex += 1) {
      for (let rightIndex = 0; rightIndex < values.length; rightIndex += 1) {
        if (leftIndex === rightIndex) continue;

        const remaining = values.filter(
          (_value, index) => index !== leftIndex && index !== rightIndex
        );

        for (const operator of OPERATORS) {
          if (operator === "/" && Math.abs(values[rightIndex]) < EPSILON) continue;

          const result = combineValues(values[leftIndex], values[rightIndex], operator);
          if (search(remaining.concat(result))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  return search(entries);
}

function randomNumber(rng = Math.random) {
  return Math.floor(rng() * 10) + 1;
}

function matchesDifficulty(numbers, difficulty) {
  if (difficulty === "easy") {
    return new Set(numbers).size < numbers.length || numbers.some((value) => value >= 8);
  }

  if (difficulty === "hard") {
    return !numbers.includes(10);
  }

  return true;
}

function generatePuzzle(difficulty = "normal", rng = Math.random) {
  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const numbers = [randomNumber(rng), randomNumber(rng), randomNumber(rng), randomNumber(rng)];
    if (matchesDifficulty(numbers, difficulty) && canMakeTarget(numbers, 24)) {
      return numbers;
    }
  }

  return [8, 8, 3, 3];
}

if (typeof module !== "undefined") {
  module.exports = {
    combineValues,
    isTwentyFour,
    applyOperation,
    canMakeTarget,
    generatePuzzle,
  };
}
