const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('./game-core');

const {
  applyAction,
  cloneState,
  confirmCapture,
  createState,
  legalMovesFrom,
  parsePosition,
  positionKey,
  selectCaptureChoice,
  simulateAction,
  tap,
  toggleCaptureVictim,
} = core;

test('creates an empty placement state and alternates after a placement', () => {
  const state = createState();

  assert.equal(state.phase, 'placement');
  assert.equal(state.currentPlayer, 'white');
  assert.deepEqual(state.placementsRemaining, { white: 8, black: 8 });

  tap('A1', state);

  assert.equal(state.board.get('A1'), 'white');
  assert.equal(state.currentPlayer, 'black');
  assert.equal(state.placementsRemaining.white, 7);
});

test('enters movement only after both sides place eight stones', () => {
  const state = createState();
  state.placementsRemaining.white = 1;
  state.placementsRemaining.black = 1;
  state.board.set('A1', 'white');

  tap('B1', state);
  assert.equal(state.phase, 'placement');
  assert.equal(state.currentPlayer, 'black');

  tap('C2', state);

  assert.equal(state.phase, 'movement');
  assert.equal(state.currentPlayer, 'white');
  assert.equal(state.winner, null);
});

test('allows only one-step horizontal and vertical movement', () => {
  const state = createState();
  state.phase = 'movement';
  state.board.set('A1', 'white');
  state.board.set('D4', 'black');

  assert.deepEqual(new Set(legalMovesFrom('A1', 'white', state)), new Set(['B1', 'A2']));
  assert.equal(legalMovesFrom('A1', 'white', state).includes('B2'), false);
  assert.equal(legalMovesFrom('D4', 'white', state).length, 0);
});

test('offers a four-line capture and confirms selected opponent stones', () => {
  const state = createState();
  state.placementsRemaining.white = 1;
  state.board.set('A1', 'white');
  state.board.set('B1', 'white');
  state.board.set('C1', 'white');
  state.board.set('D4', 'black');

  tap('D1', state);

  assert.equal(state.pendingCapture.choices.length, 1);
  assert.equal(state.pendingCapture.choices[0].takesAnyFour, true);
  assert.equal(state.currentPlayer, 'white');

  toggleCaptureVictim('D4', state);
  confirmCapture(state);

  assert.equal(state.board.has('D4'), false);
  assert.equal(state.pendingCapture, null);
  assert.equal(state.currentPlayer, 'black');
});

test('auto-captures a one- or two-stone press but rejects a friendly line of three', () => {
  const pressState = createState();
  pressState.placementsRemaining.white = 1;
  pressState.board.set('A1', 'white');
  pressState.board.set('C1', 'black');

  tap('B1', pressState);

  assert.equal(pressState.pendingCapture, null);
  assert.equal(pressState.board.has('C1'), false);

  const threeState = createState();
  threeState.placementsRemaining.white = 1;
  threeState.board.set('A1', 'white');
  threeState.board.set('C1', 'white');
  threeState.board.set('D1', 'black');

  tap('B1', threeState);

  assert.equal(threeState.pendingCapture, null);
});

test('rejects a press when the same pair is blocked from both ends', () => {
  const state = createState();
  state.placementsRemaining.white = 1;
  state.board.set('A1', 'black');
  state.board.set('B1', 'white');
  state.board.set('D1', 'black');

  tap('C1', state);

  assert.equal(state.pendingCapture, null);
  assert.equal(state.board.get('A1'), 'black');
  assert.equal(state.board.get('D1'), 'black');
});

test('forces removal when a movement-phase player has no legal move', () => {
  const state = createState();
  state.phase = 'movement';
  state.currentPlayer = 'white';
  state.mustRemoveOwnStone = true;
  state.board.set('A1', 'white');
  state.board.set('B1', 'black');
  state.board.set('A2', 'black');

  tap('A1', state);

  assert.equal(state.board.has('A1'), false);
  assert.equal(state.phase, 'finished');
  assert.equal(state.winner, 'black');
});

test('does not lose during placement when a side still has unplaced stones', () => {
  const state = createState();
  state.currentPlayer = 'black';
  state.placementsRemaining.white = 1;
  state.placementsRemaining.black = 1;

  tap('B1', state);

  assert.equal(state.phase, 'placement');
  assert.equal(state.winner, null);
  assert.equal(state.currentPlayer, 'white');
});

test('wins in movement when the opponent has no stones left', () => {
  const state = createState();
  state.phase = 'movement';
  state.currentPlayer = 'white';
  state.board.set('A1', 'white');
  state.board.set('B2', 'white');
  state.board.set('C1', 'black');

  tap('B2', state);
  tap('B1', state);

  assert.equal(state.phase, 'finished');
  assert.equal(state.winner, 'white');
});

test('clones state deeply and simulates actions without changing the source', () => {
  const state = createState();
  state.currentPlayer = 'black';
  state.board.set('A1', 'white');
  const clone = cloneState(state);
  clone.board.set('B1', 'black');

  assert.equal(state.board.has('B1'), false);
  assert.equal(parsePosition(positionKey(2, 3)).label, 'C4');

  const action = {
    kind: 'placement',
    player: 'black',
    to: 'B1',
    capturedPositions: new Set(),
  };
  const simulated = simulateAction(state, action);

  assert.equal(state.board.has('B1'), false);
  assert.equal(simulated.board.get('B1'), 'black');
  assert.equal(applyAction(state, action), true);
  assert.equal(state.board.get('B1'), 'black');
});
