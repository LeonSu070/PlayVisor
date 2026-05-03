const test = require("node:test");
const assert = require("node:assert/strict");

const {
  combineValues,
  isTwentyFour,
  applyOperation,
  canMakeTarget,
  generatePuzzle,
} = require("./game-core");

test("combineValues applies all supported operators", () => {
  assert.equal(combineValues(8, 4, "+"), 12);
  assert.equal(combineValues(8, 4, "-"), 4);
  assert.equal(combineValues(8, 4, "*"), 32);
  assert.equal(combineValues(8, 4, "/"), 2);
});

test("combineValues rejects division by zero", () => {
  assert.throws(() => combineValues(8, 0, "/"), /division by zero/i);
});

test("isTwentyFour accepts floating point results near 24", () => {
  assert.equal(isTwentyFour(24), true);
  assert.equal(isTwentyFour(23.9999999999), true);
  assert.equal(isTwentyFour(24.1), false);
});

test("applyOperation consumes two entries and appends a result entry", () => {
  const values = [
    { id: "a", value: 8, expression: "8" },
    { id: "b", value: 4, expression: "4" },
    { id: "c", value: 3, expression: "3" },
  ];

  const next = applyOperation(values, "a", "b", "+");

  assert.deepEqual(
    next.map((entry) => entry.id),
    ["c", "a+b"]
  );
  assert.equal(next[1].value, 12);
  assert.equal(next[1].expression, "(8 + 4)");
});

test("canMakeTarget recognizes a known 24 puzzle", () => {
  assert.equal(canMakeTarget([8, 8, 3, 3], 24), true);
});

test("generatePuzzle returns four numbers from 1 to 10 that can make 24", () => {
  for (let index = 0; index < 20; index += 1) {
    const puzzle = generatePuzzle("normal");

    assert.equal(puzzle.length, 4);
    assert.equal(puzzle.every((value) => Number.isInteger(value)), true);
    assert.equal(puzzle.every((value) => value >= 1 && value <= 10), true);
    assert.equal(canMakeTarget(puzzle, 24), true);
  }
});

test("generatePuzzle allows repeated random numbers", () => {
  const repeatedPuzzle = [8, 8, 3, 3];
  let index = 0;
  const rng = () => {
    const value = repeatedPuzzle[index % repeatedPuzzle.length];
    index += 1;
    return (value - 1) / 10;
  };

  assert.deepEqual(generatePuzzle("normal", rng), repeatedPuzzle);
});
