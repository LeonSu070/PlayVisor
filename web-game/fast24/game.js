const mainScreen = document.querySelector("#main-screen");
const gameScreen = document.querySelector("#game-screen");
const valuesElement = document.querySelector("#values");
const expressionElement = document.querySelector("#expression");
const completionMessage = document.querySelector("#completion-message");
const timerElement = document.querySelector("#timer");
const difficultyLabel = document.querySelector("#difficulty-label");
const rulesDialog = document.querySelector("#rules-dialog");
const difficultyDialog = document.querySelector("#difficulty-dialog");

let difficulty = "normal";
let currentPuzzle = [];
let values = [];
let selectedValueId = null;
let selectedOperator = null;
let startedAt = 0;
let elapsedMs = 0;
let timerId = null;
let solved = false;

function formatSeconds(milliseconds) {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function formatValue(value) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(3)).toString();
}

function updateTimer() {
  if (!startedAt || solved) return;
  elapsedMs = Date.now() - startedAt;
  timerElement.textContent = formatSeconds(elapsedMs);
}

function startTimer() {
  stopTimer();
  elapsedMs = 0;
  startedAt = Date.now();
  timerElement.textContent = "0.0s";
  timerId = window.setInterval(updateTimer, 100);
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function createInitialValues(numbers) {
  return numbers.map((number, index) => ({
    id: `n${index}`,
    value: number,
    expression: String(number),
  }));
}

function resetCurrentPuzzle() {
  values = createInitialValues(currentPuzzle);
  solved = false;
  selectedValueId = null;
  selectedOperator = null;
  completionMessage.classList.add("hidden");
  setExpression("Puzzle reset. The timer is still running.");
  renderValues();
  renderOperators();
}

function renderValues() {
  valuesElement.innerHTML = "";

  for (const entry of values) {
    const button = document.createElement("button");
    button.className = "value-button";
    button.type = "button";
    button.dataset.valueId = entry.id;
    button.classList.toggle("selected", entry.id === selectedValueId);
    button.disabled = solved;

    const number = document.createElement("span");
    number.className = "value-number";
    number.textContent = formatValue(entry.value);

    const expression = document.createElement("span");
    expression.className = "value-expression";
    expression.textContent = entry.expression;

    button.append(number, expression);
    valuesElement.append(button);
  }
}

function renderOperators() {
  document.querySelectorAll(".operator-button").forEach((button) => {
    button.classList.toggle("selected", button.dataset.operator === selectedOperator);
    button.disabled = solved;
  });
}

function setExpression(message) {
  expressionElement.textContent = message;
}

function clearSelection(message = "Select a number, an operator, then another number.") {
  selectedValueId = null;
  selectedOperator = null;
  setExpression(message);
  renderValues();
  renderOperators();
}

function checkSolved() {
  if (values.length === 1 && isTwentyFour(values[0].value)) {
    solved = true;
    updateTimer();
    stopTimer();
    completionMessage.textContent = `Solved in ${formatSeconds(elapsedMs)} with ${values[0].expression}`;
    completionMessage.classList.remove("hidden");
    setExpression("24 reached.");
    renderValues();
    renderOperators();
    return true;
  }

  if (values.length === 1) {
    setExpression(`${values[0].expression} = ${formatValue(values[0].value)}. Use Give Up for a new set.`);
  }

  return false;
}

function startGame() {
  const puzzle = generatePuzzle(difficulty);
  currentPuzzle = puzzle;
  values = createInitialValues(currentPuzzle);
  solved = false;
  selectedValueId = null;
  selectedOperator = null;
  completionMessage.classList.add("hidden");
  difficultyLabel.textContent = difficulty[0].toUpperCase() + difficulty.slice(1);
  mainScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  setExpression("Select a number, an operator, then another number.");
  renderValues();
  renderOperators();
  startTimer();
}

function backToMain() {
  stopTimer();
  mainScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
}

function handleValueClick(valueId) {
  if (solved) return;

  if (!selectedValueId) {
    selectedValueId = valueId;
    const selected = values.find((entry) => entry.id === valueId);
    setExpression(`${selected.expression} selected. Choose an operator.`);
    renderValues();
    return;
  }

  if (selectedValueId === valueId) {
    clearSelection();
    return;
  }

  if (!selectedOperator) {
    const selected = values.find((entry) => entry.id === selectedValueId);
    setExpression(`${selected.expression} selected. Choose an operator before another number.`);
    return;
  }

  try {
    values = applyOperation(values, selectedValueId, valueId, selectedOperator);
    const result = values[values.length - 1];
    selectedValueId = null;
    selectedOperator = null;
    setExpression(`${result.expression} = ${formatValue(result.value)}`);
    renderValues();
    renderOperators();
    checkSolved();
  } catch (error) {
    clearSelection(error.message);
  }
}

function handleOperatorClick(operator) {
  if (solved) return;

  if (!selectedValueId) {
    setExpression("Select a number before choosing an operator.");
    return;
  }

  selectedOperator = operator;
  const selected = values.find((entry) => entry.id === selectedValueId);
  setExpression(`${selected.expression} ${operator} ...`);
  renderOperators();
}

document.querySelector("#start-button").addEventListener("click", startGame);
document.querySelector("#give-up-button").addEventListener("click", startGame);
document.querySelector("#back-button").addEventListener("click", backToMain);
document.querySelector("#reset-button").addEventListener("click", resetCurrentPuzzle);
document.querySelector("#clear-button").addEventListener("click", () => clearSelection());

document.querySelector("#rules-button").addEventListener("click", () => {
  rulesDialog.showModal();
});

document.querySelector("#difficulty-button").addEventListener("click", () => {
  difficultyDialog.showModal();
});

document.querySelectorAll(".dialog-close").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.close}`).close();
  });
});

document.querySelectorAll(".difficulty-option").forEach((button) => {
  button.addEventListener("click", () => {
    difficulty = button.dataset.difficulty;
    document.querySelectorAll(".difficulty-option").forEach((option) => {
      option.classList.toggle("active", option === button);
    });
  });
});

valuesElement.addEventListener("click", (event) => {
  const button = event.target.closest(".value-button");
  if (button) {
    handleValueClick(button.dataset.valueId);
  }
});

document.querySelectorAll(".operator-button").forEach((button) => {
  button.addEventListener("click", () => handleOperatorClick(button.dataset.operator));
});
