(function attachFourLinesAI(root, factory) {
  const api = factory(root.FourLinesCore);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FourLinesAI = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function createAI(core) {
  if (!core) throw new Error('FourLinesCore must be loaded before FourLinesAI.');

  const LINES = [
    ...Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => core.positionKey(column, row))),
    ...Array.from({ length: 4 }, (_, column) => Array.from({ length: 4 }, (_, row) => core.positionKey(column, row))),
  ];

  function evaluate(state, perspective) {
    if (state.winner !== null) return state.winner === perspective ? 100000 : -100000;
    const opponent = perspective === 'white' ? 'black' : 'white';
    const ownCount = core.count(state, perspective);
    const enemyCount = core.count(state, opponent);
    let score = (ownCount - enemyCount) * 320;
    if (state.phase === 'placement') {
      const ownPlaced = 8 - state.placementsRemaining[perspective];
      const enemyPlaced = 8 - state.placementsRemaining[opponent];
      score += (ownPlaced - enemyPlaced) * 6;
      score += (16 - state.board.size) * 0.4;
    } else {
      score += (core.legalMoves(perspective, state).length
        - core.legalMoves(opponent, state).length) * 8;
    }
    for (const line of LINES) {
      const own = line.filter((key) => state.board.get(key) === perspective).length;
      const enemy = line.filter((key) => state.board.get(key) === opponent).length;
      if (enemy === 0) score += linePotential(own);
      if (own === 0) score -= linePotential(enemy) * 1.12;
    }
    if (state.mustRemoveOwnStone) score += state.currentPlayer === perspective ? -40 : 40;
    return score;
  }

  function linePotential(stones) {
    if (stones === 4) return 420;
    if (stones === 3) return 150;
    if (stones === 2) return 30;
    if (stones === 1) return 2;
    return 0;
  }

  function actionKey(action) {
    return `${action.kind}:${action.from || ''}:${action.to}:${action.captureChoiceId || ''}:${[...action.capturedPositions].sort().join(',')}`;
  }

  function createsFourLine(state, action, player) {
    if (action.kind === 'removeOwnStone') return false;
    const next = core.simulateAction(state, action);
    return LINES.some((line) => (
      line.every((key) => next.board.get(key) === player)
      && !line.every((key) => state.board.get(key) === player)
    ));
  }

  function keepMostCaptures(actions) {
    const mostCaptures = Math.max(0, ...actions.map((action) => action.capturedPositions.size));
    return mostCaptures === 0
      ? actions
      : actions.filter((action) => action.capturedPositions.size === mostCaptures);
  }

  class HardSearch {
    constructor(perspective) {
      this.perspective = perspective;
      this.nodes = 0;
    }

    choose(state) {
      const actions = core.legalActions(state, this.perspective, {
        maxCaptureVariantsPerAction: 12,
      });
      if (actions.length === 0) throw new Error('No legal AI action is available.');
      const millActions = actions.filter((action) => createsFourLine(state, action, this.perspective));
      const candidates = keepMostCaptures(millActions.length > 0 ? millActions : actions);
      const scored = [];
      for (const action of candidates) {
        this.nodes = 0;
        this.nodes += 1;
        const next = core.simulateAction(state, action);
        scored.push({ action, score: this.minimax(next, 3, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY) });
      }
      const bestScore = Math.max(...scored.map(({ score }) => score));
      const tolerance = Math.max(2, Math.abs(bestScore) * 0.01);
      const nearBest = scored.filter(({ score }) => bestScore - score <= tolerance);
      return nearBest[Math.floor(Math.random() * nearBest.length)].action;
    }

    minimax(state, depth, alpha, beta) {
      if (state.winner !== null) {
        return state.winner === this.perspective ? 100000 + depth : -100000 - depth;
      }
      if (depth <= 0 || this.nodes >= 1800) return evaluate(state, this.perspective);
      const actions = this.orderedActions(state);
      if (actions.length === 0) return evaluate(state, this.perspective);
      const maximizing = state.currentPlayer === this.perspective;
      let value = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
      for (const action of actions) {
        this.nodes += 1;
        const child = this.minimax(
          core.simulateAction(state, action),
          depth - 1,
          alpha,
          beta,
        );
        if (maximizing) {
          value = Math.max(value, child);
          alpha = Math.max(alpha, value);
        } else {
          value = Math.min(value, child);
          beta = Math.min(beta, value);
        }
        if (beta <= alpha || this.nodes >= 1800) break;
      }
      return value;
    }

    orderedActions(state) {
      const actions = core.legalActions(state, state.currentPlayer, {
        maxActions: 20,
        maxCaptureVariantsPerAction: 5,
      });
      return actions.map((action) => {
        const child = core.simulateAction(state, action);
        const terminal = child.winner === this.perspective
          ? 1000000
          : child.winner !== null ? -1000000 : 0;
        return {
          action,
          key: actionKey(action),
          order: terminal + evaluate(child, this.perspective) + action.capturedPositions.size * 500 + Math.random() * 0.01,
        };
      }).sort((left, right) => right.order - left.order).map(({ action }) => action);
    }
  }

  function chooseHardAction(state, player) {
    if (state.currentPlayer !== player || state.phase === 'finished') {
      throw new Error('The requested AI player does not have a turn.');
    }
    return new HardSearch(player).choose(core.cloneState(state));
  }

  function actionCapturedCount(action) {
    return action.capturedPositions.size;
  }

  return { actionCapturedCount, chooseHardAction };
});
