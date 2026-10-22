(function attachFourLinesCore(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FourLinesCore = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function createCore() {
  const AXES = [[1, 0], [0, 1]];
  const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const STONES = ['white', 'black'];

  function positionKey(column, row) {
    return `${String.fromCharCode(65 + column)}${row + 1}`;
  }

  function parsePosition(key) {
    if (typeof key !== 'string' || key.length !== 2) {
      return { column: -1, row: -1, label: key };
    }
    const column = key.charCodeAt(0) - 65;
    const row = Number(key[1]) - 1;
    return { column, row, label: key };
  }

  function isPositionKey(key) {
    const position = parsePosition(key);
    return position.column >= 0 && position.column < 4
      && position.row >= 0 && position.row < 4;
  }

  function offset(key, column, row) {
    const position = parsePosition(key);
    const nextColumn = position.column + column;
    const nextRow = position.row + row;
    if (nextColumn < 0 || nextColumn >= 4 || nextRow < 0 || nextRow >= 4) return null;
    return positionKey(nextColumn, nextRow);
  }

  function otherStone(stone) {
    return stone === 'white' ? 'black' : 'white';
  }

  function createState() {
    return {
      board: new Map(),
      currentPlayer: 'white',
      phase: 'placement',
      placementsRemaining: { white: 8, black: 8 },
      selectedPosition: null,
      pendingCapture: null,
      mustRemoveOwnStone: false,
      winner: null,
    };
  }

  function cloneChoice(choice) {
    return {
      id: choice.id,
      positions: new Set(choice.positions),
      takesAnyFour: choice.takesAnyFour,
      title: choice.title,
    };
  }

  function cloneState(source) {
    const copy = createState();
    copy.board = new Map(source.board);
    copy.currentPlayer = source.currentPlayer;
    copy.phase = source.phase;
    copy.placementsRemaining = { ...source.placementsRemaining };
    copy.selectedPosition = source.selectedPosition;
    copy.mustRemoveOwnStone = source.mustRemoveOwnStone;
    copy.winner = source.winner;
    if (source.pendingCapture) {
      copy.pendingCapture = {
        choices: source.pendingCapture.choices.map(cloneChoice),
        selectedChoiceIndex: source.pendingCapture.selectedChoiceIndex,
        selectedVictims: new Set(source.pendingCapture.selectedVictims),
      };
    }
    return copy;
  }

  function count(state, stone) {
    let total = 0;
    for (const value of state.board.values()) if (value === stone) total += 1;
    return total;
  }

  function legalMovesFrom(from, player, state) {
    if (state.board.get(from) !== player) return [];
    return DIRECTIONS
      .map(([column, row]) => offset(from, column, row))
      .filter((target) => target !== null && !state.board.has(target));
  }

  function legalMoves(player, state) {
    const moves = new Set();
    for (const [from, stone] of state.board.entries()) {
      if (stone !== player) continue;
      legalMovesFrom(from, player, state).forEach((move) => moves.add(move));
    }
    return [...moves];
  }

  function combinations(values, amount, limit) {
    if (amount < 0 || amount > values.length) return [];
    const result = [];
    function visit(start, chosen) {
      if (limit !== undefined && result.length >= limit) return;
      if (chosen.length === amount) {
        result.push(new Set(chosen));
        return;
      }
      for (let index = start; index <= values.length - (amount - chosen.length); index += 1) {
        if (limit !== undefined && result.length >= limit) break;
        chosen.push(values[index]);
        visit(index + 1, chosen);
        chosen.pop();
      }
    }
    visit(0, []);
    return result;
  }

  function captureChoices(position, state) {
    const choices = [];
    const opponent = otherStone(state.currentPlayer);
    for (const [axisColumn, axisRow] of AXES) {
      const line = Array.from({ length: 4 }, (_, step) => (
        axisColumn === 1
          ? positionKey(step, parsePosition(position).row)
          : positionKey(parsePosition(position).column, step)
      ));
      if (line.every((point) => state.board.get(point) === state.currentPlayer)
        && count(state, opponent) > 0) {
        const enemies = [...state.board.entries()]
          .filter(([, stone]) => stone === opponent)
          .map(([key]) => key);
        choices.push({
          id: `four-${axisColumn}-${axisRow}-${position}`,
          positions: new Set(enemies),
          takesAnyFour: true,
          title: '四子成线：任选最多四子',
        });
      }

      for (const pairStartOffset of [-1, 0]) {
        const first = offset(position, axisColumn * pairStartOffset, axisRow * pairStartOffset);
        const second = first === null ? null : offset(first, axisColumn, axisRow);
        if (first === null || second === null
          || state.board.get(first) !== state.currentPlayer
          || state.board.get(second) !== state.currentPlayer) continue;

        const opposingGroups = [];
        const pressedGroups = [];
        for (const sign of [-1, 1]) {
          const friendlyStoneBehindPair = sign === -1
            ? offset(second, axisColumn, axisRow)
            : offset(first, -axisColumn, -axisRow);
          if (friendlyStoneBehindPair !== null
            && state.board.get(friendlyStoneBehindPair) === state.currentPlayer) continue;

          const victims = [];
          let cursor = sign === -1 ? first : second;
          for (let step = 0; step < 2; step += 1) {
            const next = offset(cursor, axisColumn * sign, axisRow * sign);
            if (next !== null && state.board.get(next) === opponent) {
              victims.push(next);
              cursor = next;
            } else break;
          }
          const spaceBehindVictims = offset(cursor, axisColumn * sign, axisRow * sign);
          const canPush = spaceBehindVictims === null || !state.board.has(spaceBehindVictims);
          if (victims.length > 0) {
            const group = new Set(victims);
            opposingGroups.push(group);
            if (canPush) pressedGroups.push(group);
          }
        }
        if (opposingGroups.length === 1 && pressedGroups.length === 1) {
          const captured = pressedGroups[0];
          const labels = [...captured].join('、');
          const sortedIds = [...captured].sort();
          choices.push({
            id: `press-${sortedIds.join('-')}`,
            positions: captured,
            takesAnyFour: false,
            title: `顶子：吃掉 ${labels}`,
          });
        }
      }
    }
    const seen = new Set();
    return choices.filter((choice) => {
      if (seen.has(choice.id)) return false;
      seen.add(choice.id);
      return true;
    });
  }

  function advanceTurn(state) {
    if (state.phase === 'placement'
      && STONES.every((stone) => state.placementsRemaining[stone] === 0)) {
      state.phase = 'movement';
    }
    state.currentPlayer = otherStone(state.currentPlayer);
    state.selectedPosition = null;
    state.pendingCapture = null;
    state.mustRemoveOwnStone = false;
    if (state.phase !== 'movement') return;
    if (count(state, state.currentPlayer) === 0) {
      state.winner = otherStone(state.currentPlayer);
      state.phase = 'finished';
      return;
    }
    state.mustRemoveOwnStone = legalMoves(state.currentPlayer, state).length === 0;
  }

  function resolveAfterAction(position, state) {
    const choices = captureChoices(position, state);
    if (choices.length === 0) {
      advanceTurn(state);
      return;
    }
    if (choices.length === 1 && !choices[0].takesAnyFour) {
      for (const victim of choices[0].positions) state.board.delete(victim);
      if (state.phase === 'movement' && count(state, otherStone(state.currentPlayer)) === 0) {
        state.winner = state.currentPlayer;
        state.phase = 'finished';
      } else advanceTurn(state);
      return;
    }
    state.pendingCapture = {
      choices,
      selectedChoiceIndex: choices.length === 1 ? 0 : null,
      selectedVictims: new Set(),
    };
  }

  function tap(key, state) {
    if (state.phase === 'finished' || state.pendingCapture !== null) return;

    if (state.mustRemoveOwnStone) {
      if (state.board.get(key) !== state.currentPlayer) return;
      state.board.delete(key);
      state.selectedPosition = null;
      state.mustRemoveOwnStone = false;
      if (count(state, state.currentPlayer) === 0) {
        state.winner = otherStone(state.currentPlayer);
        state.phase = 'finished';
      } else advanceTurn(state);
      return;
    }

    if (state.phase === 'placement') {
      if (state.board.has(key) || state.placementsRemaining[state.currentPlayer] === 0) return;
      const mover = state.currentPlayer;
      state.board.set(key, mover);
      state.placementsRemaining[mover] -= 1;
      resolveAfterAction(key, state);
      return;
    }

    const selected = state.selectedPosition;
    if (selected === null) {
      if (state.board.get(key) === state.currentPlayer) state.selectedPosition = key;
      return;
    }
    if (selected === key) {
      state.selectedPosition = null;
    } else if (!state.board.has(key)
      && legalMovesFrom(selected, state.currentPlayer, state).includes(key)) {
      state.board.delete(selected);
      state.board.set(key, state.currentPlayer);
      state.selectedPosition = null;
      resolveAfterAction(key, state);
    } else if (state.board.get(key) === state.currentPlayer) {
      state.selectedPosition = key;
    }
  }

  function selectCaptureChoice(index, state) {
    const pending = state.pendingCapture;
    if (pending === null || index < 0 || index >= pending.choices.length) return;
    pending.selectedChoiceIndex = index;
    pending.selectedVictims.clear();
  }

  function toggleCaptureVictim(key, state) {
    const pending = state.pendingCapture;
    const index = pending && pending.selectedChoiceIndex;
    if (pending === null || index === null || index === undefined) return;
    const choice = pending.choices[index];
    if (!choice.takesAnyFour || state.board.get(key) !== otherStone(state.currentPlayer)) return;
    const required = Math.min(4, count(state, otherStone(state.currentPlayer)));
    if (pending.selectedVictims.has(key)) pending.selectedVictims.delete(key);
    else if (pending.selectedVictims.size < required) pending.selectedVictims.add(key);
  }

  function confirmCapture(state) {
    const pending = state.pendingCapture;
    const index = pending && pending.selectedChoiceIndex;
    if (pending === null || index === null || index === undefined) return;
    const choice = pending.choices[index];
    const victims = choice.takesAnyFour ? pending.selectedVictims : choice.positions;
    const required = choice.takesAnyFour
      ? Math.min(4, count(state, otherStone(state.currentPlayer)))
      : choice.positions.size;
    if (victims.size !== required
      || [...victims].some((victim) => state.board.get(victim) !== otherStone(state.currentPlayer))) return;
    for (const victim of victims) state.board.delete(victim);
    state.pendingCapture = null;
    state.selectedPosition = null;
    if (state.phase === 'movement' && count(state, otherStone(state.currentPlayer)) === 0) {
      state.winner = state.currentPlayer;
      state.phase = 'finished';
    } else advanceTurn(state);
  }

  function applyPrimaryAction(state, action) {
    if (state.currentPlayer !== action.player || state.phase === 'finished' || state.pendingCapture !== null) return false;
    if (action.kind === 'removeOwnStone') {
      if (!state.mustRemoveOwnStone || state.board.get(action.to) !== action.player) return false;
      tap(action.to, state);
      return !state.mustRemoveOwnStone;
    }
    if (action.kind === 'placement') {
      if (state.phase !== 'placement' || action.from !== undefined || state.board.has(action.to)
        || state.placementsRemaining[action.player] === 0) return false;
      tap(action.to, state);
      return state.board.get(action.to) === action.player;
    }
    const from = action.from;
    if (state.phase !== 'movement' || from === undefined || state.board.get(from) !== action.player
      || !legalMovesFrom(from, action.player, state).includes(action.to)) return false;
    tap(from, state);
    if (state.selectedPosition !== from) return false;
    tap(action.to, state);
    return state.board.get(action.to) === action.player;
  }

  function completeCapture(state, action) {
    const pending = state.pendingCapture;
    if (pending === null || action.captureChoiceId === undefined) return false;
    const index = pending.choices.findIndex((choice) => choice.id === action.captureChoiceId);
    if (index < 0) return false;
    selectCaptureChoice(index, state);
    const choice = state.pendingCapture.choices[index];
    if (choice.takesAnyFour) {
      for (const victim of action.capturedPositions) toggleCaptureVictim(victim, state);
    } else if (action.capturedPositions.size !== choice.positions.size
      || [...choice.positions].some((victim) => !action.capturedPositions.has(victim))) return false;
    confirmCapture(state);
    return state.pendingCapture === null;
  }

  function applyGeneratedAction(state, action) {
    if (action.player !== state.currentPlayer || !applyPrimaryAction(state, action)) return false;
    if (state.pendingCapture === null) {
      return action.captureChoiceId === undefined && action.capturedPositions.size === 0;
    }
    return completeCapture(state, action);
  }

  function replaceState(target, source) {
    target.board = new Map(source.board);
    target.currentPlayer = source.currentPlayer;
    target.phase = source.phase;
    target.placementsRemaining = { ...source.placementsRemaining };
    target.selectedPosition = source.selectedPosition;
    target.pendingCapture = source.pendingCapture;
    target.mustRemoveOwnStone = source.mustRemoveOwnStone;
    target.winner = source.winner;
  }

  function applyAction(state, action) {
    const next = cloneState(state);
    if (!applyGeneratedAction(next, action)) return false;
    replaceState(state, next);
    return true;
  }

  function simulateAction(state, action) {
    const next = cloneState(state);
    if (!applyGeneratedAction(next, action)) throw new Error('The supplied game action could not be applied.');
    return next;
  }

  function legalActions(state, player, options = {}) {
    const { maxActions, maxCaptureVariantsPerAction } = options;
    if (state.phase === 'finished' || player !== state.currentPlayer || state.pendingCapture !== null) return [];
    if (state.mustRemoveOwnStone) {
      const actions = [...state.board.entries()]
        .filter(([, stone]) => stone === player)
        .map(([to]) => ({ kind: 'removeOwnStone', player, to, capturedPositions: new Set() }));
      return maxActions === undefined ? actions : actions.slice(0, maxActions);
    }

    const baseActions = [];
    if (state.phase === 'placement') {
      if (state.placementsRemaining[player] === 0) return [];
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const to = positionKey(column, row);
          if (!state.board.has(to)) baseActions.push({ kind: 'placement', player, to, capturedPositions: new Set() });
        }
      }
    } else {
      for (const [from, stone] of state.board.entries()) {
        if (stone !== player) continue;
        for (const to of legalMovesFrom(from, player, state)) {
          baseActions.push({ kind: 'movement', player, from, to, capturedPositions: new Set() });
        }
      }
    }

    const actions = [];
    for (const action of baseActions) {
      if (maxActions !== undefined && actions.length >= maxActions) break;
      const afterBase = cloneState(state);
      if (!applyPrimaryAction(afterBase, action)) continue;
      const pending = afterBase.pendingCapture;
      if (pending === null) {
        actions.push(action);
        continue;
      }
      for (const choice of pending.choices) {
        if (maxActions !== undefined && actions.length >= maxActions) break;
        if (choice.takesAnyFour) {
          const eligible = [...afterBase.board.entries()]
            .filter(([, stone]) => stone === otherStone(player))
            .map(([key]) => key);
          const amount = Math.min(4, eligible.length);
          for (const victims of combinations(eligible, amount, maxCaptureVariantsPerAction)) {
            if (maxActions !== undefined && actions.length >= maxActions) break;
            const variant = {
              ...action,
              captureChoiceId: choice.id,
              capturedPositions: victims,
            };
            const completed = cloneState(afterBase);
            if (completeCapture(completed, variant)) actions.push(variant);
          }
        } else {
          const variant = {
            ...action,
            captureChoiceId: choice.id,
            capturedPositions: new Set(choice.positions),
          };
          const completed = cloneState(afterBase);
          if (completeCapture(completed, variant)) actions.push(variant);
        }
      }
    }
    return actions;
  }

  function actionDescription(action) {
    return `${action.from === undefined ? '' : `${action.from}→`}${action.to}`;
  }

  return {
    STONES,
    actionDescription,
    applyAction,
    cloneState,
    confirmCapture,
    count,
    createState,
    isPositionKey,
    legalActions,
    legalMoves,
    legalMovesFrom,
    parsePosition,
    positionKey,
    selectCaptureChoice,
    simulateAction,
    tap,
    toggleCaptureVictim,
  };
});
