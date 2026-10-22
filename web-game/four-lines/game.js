(function attachFourLinesGame(root, factory) {
  const api = factory(root, root.FourLinesCore, root.FourLinesAI);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FourLinesGame = api;
  if (root.document) root.FourLinesGame.boot();
})(typeof globalThis === 'undefined' ? this : globalThis, function createGame(root, core, ai) {
  const DEFAULT_SETTINGS = { locale: 'zh', effectsVolume: 0.55, musicVolume: 0.55 };
  const KEYS = {
    locale: 'fourLinesLocale',
    effectsVolume: 'fourLinesEffectsVolume',
    musicVolume: 'fourLinesMusicVolume',
  };
  const POINT_X = [0.142, 0.381, 0.614, 0.854];
  const POINT_Y = [0.154, 0.379, 0.610, 0.837];
  const STRINGS = {
    zh: {
      appTitle: '四条', subtitle: '四子成线，顶子取胜', playAi: '人机对战', playLocal: '双人单机对战',
      mainMenu: '返回起始页', restart: '重新开始', language: '语言', rules: '游戏规则', close: '关闭',
      effects: '音效', music: '音乐', placement: '下子阶段', movement: '走子阶段', finished: '对局结束',
      placeHint: '双方各下八子后开始走子', moveHint: '沿棋线每次移动一格', chooseCapture: '选择一种吃法',
      confirmCapture: '确认吃子', thinking: '电脑思考中…', white: '白方', black: '黑方', empty: '空位',
      captureAny: '四子成线：任选最多四子', selectedVictims: (selected, required) => `点选对方棋子（已选 ${selected}/${required}）`,
      statusWin: (side) => `${side}获胜`, statusCapture: '形成吃子，请选择吃法',
      statusRemove: (side) => `${side}无路可走，请淘汰一子`, statusPlace: (side, remaining) => `${side}下子 · 剩余 ${remaining} 子`,
      statusMove: (side) => `轮到${side}走子`, capturePress: (positions) => `顶子：吃掉 ${positions.join('、')}`,
      rulesSections: [
        ['棋盘与棋子', ['棋盘有 16 个交点。列从左到右为 A 到 D，行从上到下为 1 到 4。', '黑白双方各有 8 枚棋子，白方先手，双方轮流行动。']],
        ['一、下子', ['双方轮流将一枚棋子放到空交点，直到双方各下完 8 枚。', '下子时也可以吃子。如果出现多种吃法，由当前玩家选择一种。', '双方都下完 8 枚后，才进入走子阶段。']],
        ['二、走子', ['每次移动一枚棋子，沿横线或竖线走到相邻的空交点。不能斜走。', '走子后也可以吃子。']],
        ['吃子规则', ['四子成线：己方 4 枚棋子横向或竖向连成一条完整直线后，可以任选最多 4 枚对方棋子吃掉。', '顶子：恰好连续的 2 枚己方棋子，可以把紧邻的 1 或 2 枚连续对方棋子顶向空位或棋盘边缘，并吃掉被顶的棋子。', '连续 3 枚或更多己方棋子不能顶吃。如果这对己方棋子两端都被顶住，则两边都不能吃。', '以上两种吃法在下子和走子阶段都有效。']],
        ['无棋可走', ['走子阶段轮到自己时，如果所有棋子都无法移动，就必须淘汰一枚自己的棋子，并结束本回合。']],
        ['胜负', ['进入走子阶段后，若对方棋子全部被吃掉，则获胜。下子阶段即使棋盘上的棋子暂时被吃光，只要还有棋子未下完，对局就继续；双方各下完 8 枚后才开始判定。']],
      ],
    },
    en: {
      appTitle: 'Four Lines', subtitle: 'Four stones make a line', playAi: 'Play vs computer', playLocal: 'Two players on one device',
      mainMenu: 'Main menu', restart: 'Restart', language: 'Language', rules: 'How to play', close: 'Close',
      effects: 'Effects', music: 'Music', placement: 'Placement', movement: 'Movement', finished: 'Game over',
      placeHint: 'Place eight stones each to begin moving', moveHint: 'Move one step along a line', chooseCapture: 'Choose a capture',
      confirmCapture: 'Confirm capture', thinking: 'Computer is thinking…', white: 'White', black: 'Black', empty: 'empty',
      captureAny: 'Four in a row: capture up to four stones', selectedVictims: (selected, required) => `Choose opponent stones (${selected}/${required} selected)`,
      statusWin: (side) => `${side} wins`, statusCapture: 'Capture available. Choose how to capture.',
      statusRemove: (side) => `${side} has no moves. Remove one of your stones.`, statusPlace: (side, remaining) => `${side} to place · ${remaining} remaining`,
      statusMove: (side) => `${side}'s turn to move`, capturePress: (positions) => `Press: capture ${positions.join(', ')}`,
      rulesSections: [
        ['The board', ['The board has 16 intersections. Columns run A to D from left to right, and rows run 1 to 4 from top to bottom.', 'Black and White each have 8 stones. White plays first, and players take turns.']],
        ['1. Place your stones', ['Take turns placing one stone on an empty intersection until both sides have placed all 8 stones.', 'Captures can happen during placement. The moving side chooses a capture when more than one option is available.', 'The movement phase starts only after both sides have placed all 8 stones.']],
        ['2. Move your stones', ['Move one stone by one step to a neighboring empty intersection along a horizontal or vertical line. Diagonal moves are not allowed.', 'Captures can also happen after a move.']],
        ['Capturing stones', ['Four in a row: make an unbroken line of 4 of your stones horizontally or vertically, then capture up to 4 opposing stones of your choice.', 'Press: exactly 2 consecutive stones of yours can press 1 or 2 consecutive opposing stones toward an empty intersection or the edge of the board. Capture the pressed stones.', 'A line of 3 or more of your stones cannot press stones. If the pair is pressed from both ends, neither side can capture it.', 'Both capture rules apply during placement and movement.']],
        ['If you cannot move', ['When it is your turn in the movement phase and none of your stones can move, remove one of your own stones. This uses your turn.']],
        ['Winning', ['A player wins during the movement phase when the opponent has no stones left. Losing all stones still being placed does not end the game; finish placing all 8 stones on each side first.']],
      ],
    },
  };

  function clampVolume(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return DEFAULT_SETTINGS.effectsVolume;
    return Math.max(0, Math.min(1, number));
  }

  function normalizeLocale(value) { return value === 'en' ? 'en' : 'zh'; }

  function loadSettings(storage) {
    const source = storage || root.localStorage;
    if (!source) return { ...DEFAULT_SETTINGS };
    return {
      locale: normalizeLocale(source.getItem(KEYS.locale)),
      effectsVolume: clampVolume(source.getItem(KEYS.effectsVolume) ?? DEFAULT_SETTINGS.effectsVolume),
      musicVolume: clampVolume(source.getItem(KEYS.musicVolume) ?? DEFAULT_SETTINGS.musicVolume),
    };
  }

  function saveSettings(storage, settings) {
    const target = storage || root.localStorage;
    if (!target) return;
    target.setItem(KEYS.locale, normalizeLocale(settings.locale));
    target.setItem(KEYS.effectsVolume, String(clampVolume(settings.effectsVolume)));
    target.setItem(KEYS.musicVolume, String(clampVolume(settings.musicVolume)));
  }

  function isCurrentRequest(activeRequestId, requestId) { return activeRequestId === requestId; }

  class AudioManager {
    constructor() {
      this.effectsVolume = DEFAULT_SETTINGS.effectsVolume;
      this.musicVolume = DEFAULT_SETTINGS.musicVolume;
      this.unlocked = false;
      this.music = this.createAudio('music.mp3', true);
      this.effects = {
        place: this.createAudio('place.wav'), move: this.createAudio('move.wav'),
        victory: this.createAudio('victory.wav'), defeat: this.createAudio('defeat.wav'),
      };
    }

    createAudio(file, loop = false) {
      if (typeof root.Audio !== 'function') return null;
      const audio = new root.Audio(`./assets/audio/${file}`);
      audio.loop = loop;
      audio.preload = 'auto';
      return audio;
    }

    setEffectsVolume(value) {
      this.effectsVolume = clampVolume(value);
      for (const audio of Object.values(this.effects)) if (audio) audio.volume = this.effectsVolume;
    }

    setMusicVolume(value) {
      this.musicVolume = clampVolume(value);
      if (this.music) this.music.volume = this.musicVolume;
    }

    async unlock() {
      this.unlocked = true;
      if (!this.music || this.musicVolume === 0) return;
      try { await this.music.play(); } catch (_) { /* Retry on the next gesture. */ }
    }

    async playEffect(kind) {
      const source = this.effects[kind];
      if (!source || !this.unlocked || this.effectsVolume === 0) return;
      source.currentTime = 0;
      source.volume = this.effectsVolume;
      try { await source.play(); } catch (_) { /* Browser autoplay policy may still apply. */ }
    }

    pause() { if (this.music) this.music.pause(); }

    async resume() {
      if (!this.unlocked || !this.music || this.musicVolume === 0) return;
      try { await this.music.play(); } catch (_) { /* Ignore transient policy errors. */ }
    }
  }

  class GameController {
    constructor(documentRef = root.document, storage = root.localStorage) {
      if (!documentRef || !core || !ai) throw new Error('GameController requires browser APIs and game modules.');
      this.document = documentRef;
      this.storage = storage;
      this.settings = loadSettings(storage);
      this.audio = new AudioManager();
      this.audio.setEffectsVolume(this.settings.effectsVolume);
      this.audio.setMusicVolume(this.settings.musicVolume);
      this.mode = 'local';
      this.showHome = true;
      this.state = core.createState();
      this.isThinking = false;
      this.computerRequestId = 0;
      this.traceAction = null;
      this.traceTimer = null;
      this.pointButtons = new Map();
      this.bindEvents();
      this.buildBoardPoints();
      this.render();
    }

    strings() { return STRINGS[this.settings.locale]; }
    byId(id) { return this.document.getElementById(id); }

    bindEvents() {
      this.byId('start-ai').addEventListener('click', () => { void this.startGame('ai'); });
      this.byId('start-local').addEventListener('click', () => { void this.startGame('local'); });
      this.byId('return-home').addEventListener('click', () => this.returnToHome());
      this.byId('restart-game').addEventListener('click', () => this.restart());
      this.byId('home-rules').addEventListener('click', () => this.openRules());
      this.byId('game-rules').addEventListener('click', () => this.openRules());
      this.byId('home-language').addEventListener('click', () => this.toggleLanguageMenu());
      this.byId('game-language').addEventListener('click', () => this.toggleLanguageMenu());
      this.byId('close-rules').addEventListener('click', () => this.closeRules());
      this.byId('rules-modal').addEventListener('click', (event) => {
        if (event.target === this.byId('rules-modal')) this.closeRules();
      });
      this.byId('language-menu').addEventListener('click', (event) => {
        const locale = event.target.closest('[data-locale]')?.dataset.locale;
        if (locale) this.setLocale(locale);
      });
      this.byId('effects-volume').addEventListener('input', (event) => this.updateVolume('effectsVolume', event.target.value));
      this.byId('music-volume').addEventListener('input', (event) => this.updateVolume('musicVolume', event.target.value));
      this.document.addEventListener('click', (event) => {
        if (!event.target.closest('#home-language, #game-language, #language-menu')) this.byId('language-menu').hidden = true;
      });
      this.document.addEventListener('visibilitychange', () => {
        if (this.document.visibilityState === 'hidden') this.audio.pause();
        else void this.audio.resume();
      });
    }

    buildBoardPoints() {
      const container = this.byId('board-points');
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const key = core.positionKey(column, row);
          const button = this.document.createElement('button');
          button.type = 'button';
          button.className = 'point-button';
          button.dataset.position = key;
          button.style.left = `${POINT_X[column] * 100}%`;
          button.style.top = `${POINT_Y[row] * 100}%`;
          button.addEventListener('click', () => this.handlePointClick(key));
          container.appendChild(button);
          this.pointButtons.set(key, button);
        }
      }
      for (let column = 0; column < 4; column += 1) {
        const badge = this.document.createElement('span');
        badge.className = 'coordinate column';
        badge.textContent = String.fromCharCode(65 + column);
        badge.style.left = `${POINT_X[column] * 100}%`;
        container.appendChild(badge);
      }
      for (let row = 0; row < 4; row += 1) {
        const badge = this.document.createElement('span');
        badge.className = 'coordinate row';
        badge.textContent = String(row + 1);
        badge.style.top = `${POINT_Y[row] * 100}%`;
        container.appendChild(badge);
      }
    }

    async startGame(mode) {
      await this.audio.unlock();
      this.computerRequestId += 1;
      this.mode = mode;
      this.showHome = false;
      this.isThinking = false;
      this.state = core.createState();
      this.clearTrace();
      this.render();
    }

    restart() {
      this.computerRequestId += 1;
      this.isThinking = false;
      this.state = core.createState();
      this.clearTrace();
      void this.audio.unlock();
      this.render();
    }

    returnToHome() {
      this.computerRequestId += 1;
      this.isThinking = false;
      this.showHome = true;
      this.state = core.createState();
      this.clearTrace();
      this.render();
    }

    setLocale(locale) {
      this.settings.locale = normalizeLocale(locale);
      saveSettings(this.storage, this.settings);
      this.byId('language-menu').hidden = true;
      this.render();
      if (!this.byId('rules-modal').hidden) this.renderRules();
    }

    updateVolume(kind, value) {
      this.settings[kind] = clampVolume(value);
      if (kind === 'effectsVolume') this.audio.setEffectsVolume(this.settings[kind]);
      else this.audio.setMusicVolume(this.settings[kind]);
      saveSettings(this.storage, this.settings);
      this.renderVolumeValues();
    }

    toggleLanguageMenu() { const menu = this.byId('language-menu'); menu.hidden = !menu.hidden; }

    openRules() { this.renderRules(); this.byId('rules-modal').hidden = false; }
    closeRules() { this.byId('rules-modal').hidden = true; }

    handlePointClick(key) {
      if (this.isThinking || (this.mode === 'ai' && this.state.currentPlayer === 'black')) return;
      const beforeBoard = new Map(this.state.board);
      const beforePhase = this.state.phase;
      if (this.state.pendingCapture) core.toggleCaptureVictim(key, this.state);
      else core.tap(key, this.state);
      this.render();
      if (this.boardChanged(beforeBoard, this.state.board)) void this.audio.playEffect(beforePhase === 'placement' ? 'place' : 'move');
      if (this.state.phase === 'finished') this.playGameResult();
      this.scheduleComputerTurn();
    }

    boardChanged(before, after) {
      if (before.size !== after.size) return true;
      for (const [key, value] of before) if (after.get(key) !== value) return true;
      return false;
    }

    confirmCapture() {
      if (this.isThinking) return;
      const beforePhase = this.state.phase;
      const beforeBoard = new Map(this.state.board);
      core.confirmCapture(this.state);
      this.render();
      if (this.boardChanged(beforeBoard, this.state.board)) void this.audio.playEffect(beforePhase === 'placement' ? 'place' : 'move');
      if (this.state.phase === 'finished') this.playGameResult();
      this.scheduleComputerTurn();
    }

    scheduleComputerTurn() {
      if (this.mode !== 'ai' || this.state.currentPlayer !== 'black' || this.isThinking
        || this.state.phase === 'finished' || this.state.pendingCapture) return;
      const requestId = ++this.computerRequestId;
      const snapshot = core.cloneState(this.state);
      this.isThinking = true;
      this.render();
      root.setTimeout(() => {
        let action = null;
        try { action = ai.chooseHardAction(snapshot, 'black'); } catch (_) { /* Fallback below. */ }
        if (!isCurrentRequest(this.computerRequestId, requestId) || this.showHome || this.mode !== 'ai') return;
        this.isThinking = false;
        const beforePhase = this.state.phase;
        const beforeBoard = new Map(this.state.board);
        const applied = action ? core.applyAction(this.state, action) : false;
        if (!applied) {
          const fallback = core.legalActions(this.state, 'black')[0];
          if (fallback) core.applyAction(this.state, fallback);
        }
        if (action && applied) {
          this.traceAction = action;
          clearTimeout(this.traceTimer);
          this.traceTimer = root.setTimeout(() => { this.traceAction = null; this.render(); }, 2200);
          void this.audio.playEffect(beforePhase === 'placement' ? 'place' : 'move');
        } else if (this.boardChanged(beforeBoard, this.state.board)) {
          void this.audio.playEffect(beforePhase === 'placement' ? 'place' : 'move');
        }
        this.render();
        if (this.state.phase === 'finished') this.playGameResult();
      }, 650);
    }

    playGameResult() {
      if (!this.state.winner) return;
      const won = this.mode === 'local' || this.state.winner === 'white';
      void this.audio.playEffect(won ? 'victory' : 'defeat');
    }

    clearTrace() { this.traceAction = null; clearTimeout(this.traceTimer); }

    render() {
      const strings = this.strings();
      this.document.documentElement.lang = this.settings.locale === 'en' ? 'en' : 'zh-CN';
      this.byId('home-screen').hidden = !this.showHome;
      this.byId('game-screen').hidden = this.showHome;
      this.byId('home-title').textContent = strings.appTitle;
      this.byId('home-subtitle').textContent = strings.subtitle;
      this.byId('start-ai-label').textContent = strings.playAi;
      this.byId('start-local-label').textContent = strings.playLocal;
      this.byId('game-title').textContent = strings.appTitle;
      this.byId('phase-badge').textContent = this.phaseName(this.state.phase);
      this.byId('home-language').setAttribute('aria-label', strings.language);
      this.byId('game-language').setAttribute('aria-label', strings.language);
      this.byId('home-rules').setAttribute('aria-label', strings.rules);
      this.byId('game-rules').setAttribute('aria-label', strings.rules);
      this.byId('return-home').textContent = strings.mainMenu;
      this.byId('restart-game').textContent = strings.restart;
      this.byId('effects-label').textContent = strings.effects;
      this.byId('music-label').textContent = strings.music;
      this.byId('game-hint').textContent = this.state.phase === 'placement' ? strings.placeHint : strings.moveHint;
      this.renderVolumeValues();
      if (!this.showHome) {
        this.renderStatus();
        this.renderBoard();
        this.renderCapturePanel();
      }
    }

    renderVolumeValues() {
      const effects = Math.round(this.settings.effectsVolume * 100);
      const music = Math.round(this.settings.musicVolume * 100);
      this.byId('effects-volume').value = String(this.settings.effectsVolume);
      this.byId('music-volume').value = String(this.settings.musicVolume);
      this.byId('effects-value').textContent = `${effects}%`;
      this.byId('music-value').textContent = `${music}%`;
    }

    phaseName(phase) {
      const strings = this.strings();
      return phase === 'placement' ? strings.placement : phase === 'movement' ? strings.movement : strings.finished;
    }

    sideName(stone) { return stone === 'white' ? this.strings().white : this.strings().black; }

    statusText() {
      const strings = this.strings();
      if (this.isThinking) return strings.thinking;
      if (this.state.winner) return strings.statusWin(this.sideName(this.state.winner));
      if (this.state.pendingCapture) return strings.statusCapture;
      if (this.state.mustRemoveOwnStone) return strings.statusRemove(this.sideName(this.state.currentPlayer));
      if (this.state.phase === 'placement') return strings.statusPlace(this.sideName(this.state.currentPlayer), this.state.placementsRemaining[this.state.currentPlayer]);
      return strings.statusMove(this.sideName(this.state.currentPlayer));
    }

    renderStatus() {
      const banner = this.byId('status-banner');
      banner.classList.toggle('winner', Boolean(this.state.winner));
      banner.classList.toggle('attention', Boolean(this.isThinking || this.state.pendingCapture || this.state.mustRemoveOwnStone));
      this.byId('status-text').textContent = this.statusText();
      this.byId('status-marker').classList.toggle('black', this.state.currentPlayer === 'black');
      this.byId('white-count').textContent = `${this.strings().white} ${core.count(this.state, 'white')}/8`;
      this.byId('black-count').textContent = `${this.strings().black} ${core.count(this.state, 'black')}/8`;
    }

    renderBoard() {
      const legalTargets = this.state.selectedPosition === null
        ? new Set()
        : new Set(core.legalMovesFrom(this.state.selectedPosition, this.state.currentPlayer, this.state));
      const pending = this.state.pendingCapture;
      const choice = pending && pending.selectedChoiceIndex !== null
        ? pending.choices[pending.selectedChoiceIndex]
        : null;
      for (const [key, button] of this.pointButtons) {
        const position = core.parsePosition(key);
        const stone = this.state.board.get(key);
        const selected = this.state.selectedPosition === key;
        const selectedVictim = Boolean(pending && pending.selectedVictims.has(key))
          || Boolean(choice && !choice.takesAnyFour && choice.positions.has(key));
        const opponent = this.state.currentPlayer === 'white' ? 'black' : 'white';
        const eligibleVictim = Boolean(choice && choice.takesAnyFour && stone === opponent);
        const classes = ['point-button'];
        if (legalTargets.has(key) || (this.state.mustRemoveOwnStone && stone === this.state.currentPlayer)) classes.push('target');
        if (selected) classes.push('selected');
        if (selectedVictim) classes.push('victim');
        if (eligibleVictim) classes.push('eligible');
        if (this.traceAction && (this.traceAction.to === key || this.traceAction.from === key)) classes.push('trace');
        button.className = classes.join(' ');
        button.setAttribute('aria-label', `${key}${stone ? `, ${this.sideName(stone)}` : `, ${this.strings().empty}`}`);
        button.textContent = '';
        if (stone) {
          const stoneElement = this.document.createElement('span');
          stoneElement.className = `stone ${stone}`;
          button.appendChild(stoneElement);
        }
        button.style.left = `${POINT_X[position.column] * 100}%`;
        button.style.top = `${POINT_Y[position.row] * 100}%`;
      }
      const oldTrace = this.byId('board-trace');
      if (oldTrace) oldTrace.remove();
      if (this.traceAction?.from) {
        const from = core.parsePosition(this.traceAction.from);
        const to = core.parsePosition(this.traceAction.to);
        const line = this.document.createElement('span');
        line.id = 'board-trace';
        line.className = 'trace-line';
        const x1 = POINT_X[from.column] * 100;
        const y1 = POINT_Y[from.row] * 100;
        const x2 = POINT_X[to.column] * 100;
        const y2 = POINT_Y[to.row] * 100;
        line.style.left = `${x1}%`;
        line.style.top = `${y1}%`;
        line.style.width = `${Math.hypot(x2 - x1, y2 - y1)}%`;
        line.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI}deg)`;
        this.byId('board-points').appendChild(line);
      }
    }

    renderCapturePanel() {
      const panel = this.byId('capture-panel');
      const pending = this.state.pendingCapture;
      panel.hidden = !pending;
      if (!pending) { panel.textContent = ''; return; }
      const strings = this.strings();
      panel.textContent = '';
      if (pending.choices.length > 1) {
        const heading = this.document.createElement('h3');
        heading.textContent = strings.chooseCapture;
        panel.appendChild(heading);
        pending.choices.forEach((choice, index) => {
          const button = this.document.createElement('button');
          button.type = 'button';
          button.className = `capture-choice${pending.selectedChoiceIndex === index ? ' selected' : ''}`;
          button.textContent = this.captureChoiceText(choice);
          button.addEventListener('click', () => { core.selectCaptureChoice(index, this.state); this.render(); });
          panel.appendChild(button);
        });
      }
      const choice = pending.selectedChoiceIndex === null ? null : pending.choices[pending.selectedChoiceIndex];
      if (!choice) return;
      const summary = this.document.createElement('p');
      summary.className = 'capture-summary';
      const opponent = this.state.currentPlayer === 'white' ? 'black' : 'white';
      summary.textContent = choice.takesAnyFour
        ? strings.selectedVictims(pending.selectedVictims.size, Math.min(4, core.count(this.state, opponent)))
        : this.captureChoiceText(choice);
      panel.appendChild(summary);
      const confirm = this.document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'capture-confirm';
      confirm.textContent = strings.confirmCapture;
      const required = choice.takesAnyFour ? Math.min(4, core.count(this.state, opponent)) : choice.positions.size;
      confirm.disabled = choice.takesAnyFour && pending.selectedVictims.size !== required;
      confirm.addEventListener('click', () => this.confirmCapture());
      panel.appendChild(confirm);
    }

    captureChoiceText(choice) {
      return choice.takesAnyFour ? this.strings().captureAny : this.strings().capturePress([...choice.positions]);
    }

    renderRules() {
      const strings = this.strings();
      this.byId('rules-title').textContent = strings.rules;
      this.byId('close-rules').setAttribute('aria-label', strings.close);
      const content = this.byId('rules-content');
      content.textContent = '';
      for (const [heading, paragraphs] of strings.rulesSections) {
        const card = this.document.createElement('article');
        card.className = 'rule-card';
        const h3 = this.document.createElement('h3');
        h3.textContent = heading;
        card.appendChild(h3);
        for (const paragraph of paragraphs) {
          const p = this.document.createElement('p');
          p.textContent = paragraph;
          card.appendChild(p);
        }
        content.appendChild(card);
      }
    }
  }

  function boot() {
    if (!root.document || root.fourLinesController) return root.fourLinesController;
    root.fourLinesController = new GameController();
    return root.fourLinesController;
  }

  return {
    AudioManager, DEFAULT_SETTINGS, GameController, KEYS, STRINGS, boot,
    clampVolume, isCurrentRequest, loadSettings, normalizeLocale, saveSettings,
  };
});
