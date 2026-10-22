# 四条 Web 游戏 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Flutter 3.47.7 / Dart 3.13.5 版本的“ 四条 ”完整迁移为 PlayVisor 静态 Web 游戏，接入首页并发布到 `https://game.iyouhey.com`。

**Architecture:** 用不依赖 DOM 的 CommonJS/浏览器兼容核心模块承载规则状态和行动生成；用独立 AI 模块移植 Flutter 困难搜索；用单页 HTML/CSS/JS 负责响应式界面、音频、语言和持久化。首页只增加一个静态入口，部署继续使用 PlayVisor 当前的 nginx 静态目录。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Node 内置 `node:test`、浏览器 Canvas/DOM APIs、原生 `Audio`、`localStorage`。

**Spec:** `docs/superpowers/specs/2026-10-23-four-lines-web-game-design.md`

## Global Constraints

- “复刻 Flutter iOS 版本的规则、状态转移、困难 AI、界面流程、音频和中英文文案。”
- “保持 PlayVisor 当前静态站约束，不引入 Flutter Web、后端服务或大型运行时依赖。”
- “不实现联网对战；Flutter iOS 当前版本只包含双人单机和人机模式。”
- “不改动 PlayVisor 其它已有游戏的逻辑和资源。”
- 游戏必须可直接从 `web-game/four-lines/index.html` 打开，测试必须可通过 Node 运行。

## Review Focus

- 多种吃法与“四子成线任选最多四子”不能跳过确认；由 Task 1 的 pending-capture 测试覆盖。
- 顶子边界、三子禁止顶吃、双向被顶禁止吃不能误判；由 Task 1 的规则矩阵测试覆盖。
- AI 搜索不能修改传入状态，也不能返回非法行动；由 Task 2 的克隆与合法行动测试覆盖。
- 浏览器重开后语言/音量必须保留，自动播放被浏览器拒绝时第一次点击仍能解锁；由 Task 3 的状态持久化辅助函数测试和 Task 4 的浏览器验收覆盖。
- 过期 AI 结果不能覆盖重开或返回首页后的新对局；由 Task 4 的请求序号测试覆盖。

---

### Task 1: 移植四条规则核心并建立测试基线

**Files:**
- Create: `web-game/four-lines/game-core.js`
- Create: `web-game/four-lines/game-core.test.js`

**Interfaces:**
- Consumes: 无；规则参数来自规格和 Flutter `lib/game/game_engine.dart`。
- Produces: 浏览器全局 `FourLinesCore` 与 Node `module.exports`，包含 `createState`, `cloneState`, `positionKey`, `parsePosition`, `count`, `legalMovesFrom`, `legalMoves`, `legalActions`, `tap`, `selectCaptureChoice`, `toggleCaptureVictim`, `confirmCapture`, `applyAction`, `simulateAction`, `actionDescription`。

- [ ] **Step 1: Write the failing tests**

  在 `game-core.test.js` 中先写 Node `node:test` 用例，使用 `require('./game-core')`，覆盖：初始状态与白方下子；双方各下 8 子后切换到 movement；只能横竖相邻移动；四子线产生 `takesAnyFour` 吃法并在选择 1-4 枚后确认；顶子的一至两枚、三子禁止、双向被顶禁止；无路可走时必须淘汰己方棋子；下子阶段暂时清空棋盘不判负；走子阶段清空对方棋子判胜；`cloneState` 深复制。

- [ ] **Step 2: Run tests to verify they fail**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: FAIL because `game-core.js` does not exist or the exported functions are missing.

- [ ] **Step 3: Implement the core state and rules**

  在 `game-core.js` 中实现 4×4 坐标、状态复制、合法行动、下子/走子、吃子选择和回合推进。保持 Flutter 的 `pendingCapture`, `mustRemoveOwnStone`, `placementsRemaining`, `winner` 语义；`applyAction` 必须复制后验证并只在完整行动成功时提交，`simulateAction` 必须返回独立状态。

- [ ] **Step 4: Run the focused tests**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: all core rule tests PASS with zero failures.

- [ ] **Step 5: Commit the core**

  ```bash
  git add web-game/four-lines/game-core.js web-game/four-lines/game-core.test.js
  git commit -m "feat: add four lines game rules engine"
  ```

### Task 2: 移植困难 AI 并验证合法行动

**Files:**
- Create: `web-game/four-lines/ai.js`
- Modify: `web-game/four-lines/game-core.test.js`

**Interfaces:**
- Consumes: `FourLinesCore.cloneState`, `FourLinesCore.legalActions`, `FourLinesCore.simulateAction` and the state/action shapes from Task 1。
- Produces: 浏览器全局 `FourLinesAI.chooseHardAction(state, player)` and `FourLinesAI.actionCapturedCount(action)`；`chooseHardAction` returns a complete legal action synchronously for a copied state。

- [ ] **Step 1: Write the failing AI tests**

  增加测试：AI 在 placement 和 movement 状态都有返回值；返回行动的 `player` 等于当前玩家且可被 `simulateAction` 应用；AI 选择前不改变原状态；存在立即获胜或更多吃子时优先选择；重复调用允许在近似同分时返回不同合法行动。

- [ ] **Step 2: Run tests to verify the AI tests fail**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: FAIL because `ai.js` and `FourLinesAI` are not implemented.

- [ ] **Step 3: Implement `ai.js`**

  移植 Flutter `game_ai.dart` 的评价函数和深度 4 alpha-beta 搜索：最多约 1800 节点；优先产生四子线，再按吃子数量排序；评价棋子数量、可走步数、已下子数、空位和横竖线潜力；对最高分 1% 容差内的行动随机选择。所有模拟使用 `cloneState`，不直接修改输入对象。

- [ ] **Step 4: Run the full core/AI tests**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: all rule and AI tests PASS。

- [ ] **Step 5: Commit the AI**

  ```bash
  git add web-game/four-lines/ai.js web-game/four-lines/game-core.test.js
  git commit -m "feat: add four lines hard AI"
  ```

### Task 3: 搭建静态页面、资源、响应式棋盘和持久化辅助

**Files:**
- Create: `web-game/four-lines/index.html`
- Create: `web-game/four-lines/styles.css`
- Create: `web-game/four-lines/game.js`
- Create: `web-game/four-lines/assets/board.png`
- Create: `web-game/four-lines/assets/audio/music.mp3`
- Create: `web-game/four-lines/assets/audio/place.wav`
- Create: `web-game/four-lines/assets/audio/move.wav`
- Create: `web-game/four-lines/assets/audio/victory.wav`
- Create: `web-game/four-lines/assets/audio/defeat.wav`
- Modify: `web-game/four-lines/game-core.test.js`

**Interfaces:**
- Consumes: `FourLinesCore` from Task 1 and `FourLinesAI` from Task 2。
- Produces: 单页 DOM 结构（`home-screen`, `game-screen`, `rules-modal`）、`localStorage` 键 `fourLinesLocale`, `fourLinesEffectsVolume`, `fourLinesMusicVolume`，以及可由 `game.js` 使用的 `AudioManager` 和 `GameController`。

- [ ] **Step 1: Write the failing persistence tests**

  在测试中加入无 DOM 的纯辅助函数测试，固定默认值 0.55、音量范围裁剪、语言值只接受 `zh/en`，并验证 `loadSettings`/`saveSettings` 的字段名和 round-trip 行为。

- [ ] **Step 2: Run the persistence tests to verify they fail**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: FAIL because the settings helpers do not exist.

- [ ] **Step 3: Implement page shell and assets**

  创建零构建 HTML，按依赖顺序加载 `game-core.js`, `ai.js`, `game.js`；复制源项目 `four-lines-board-reference.png` 为 `assets/board.png`，复制五个音频文件。CSS 实现暖米色背景、木色字体、最大宽度约 560px、移动端弹层和无横向滚动布局。

- [ ] **Step 4: Implement `AudioManager` and settings helpers**

  用原生 `Audio` 管理循环音乐和四种音效；`unlock()` 在开始游戏的用户事件中调用；实现音量滑块、localStorage 读写、切后台暂停和回前台恢复。将纯设置读写函数暴露给 Node 测试使用，并在浏览器环境下挂到 `FourLinesGame`。

- [ ] **Step 5: Run persistence tests to verify they pass**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: all core, AI and settings tests PASS。

- [ ] **Step 6: Commit the page shell and assets**

  ```bash
  git add web-game/four-lines
  git commit -m "feat: add four lines web game shell and assets"
  ```

### Task 4: 接入完整交互、AI 回合、规则页和中英文 UI

**Files:**
- Modify: `web-game/four-lines/index.html`
- Modify: `web-game/four-lines/styles.css`
- Modify: `web-game/four-lines/game.js`
- Modify: `web-game/four-lines/game-core.test.js`

**Interfaces:**
- Consumes: Task 1 的核心状态/行动 API、Task 2 的 `FourLinesAI.chooseHardAction`、Task 3 的页面 shell 与 `AudioManager`。
- Produces: 可玩的 `GameController`，处理 `startGame(mode)`, `handlePointClick(key)`, `confirmCapture()`, `restart()`, `returnToHome()`, `setLocale(locale)`，并维护递增的 `computerRequestId`。

- [ ] **Step 1: Write the failing controller tests**

  为 `GameController` 的纯请求序号辅助逻辑增加测试：重开或返回首页后，旧 AI 请求的结果不能提交到新 state；同时增加首页入口 HTML 结构断言所需的稳定 `data-game` 标识。

- [ ] **Step 2: Run the controller tests to verify they fail**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: FAIL because controller request guards and stable page markers are not implemented.

- [ ] **Step 3: Implement the game controller and board rendering**

  用 DOM 渲染棋盘背景、16 个交点和棋子；沿用 Flutter 的坐标比例 `[0.142, 0.381, 0.614, 0.854]` / `[0.154, 0.379, 0.610, 0.837]`。实现点击下子、点击己方棋子后选择走子、合法目标高亮、吃法选项、任选对方棋子、确认、强制淘汰和胜负状态更新；AI 思考期间禁用棋盘输入并用 `setTimeout` 异步启动搜索。

- [ ] **Step 4: Implement AI request guards and audio events**

  每次开始、重开、返回首页递增 `computerRequestId`；AI 完成后仅当 request id、模式、阶段仍匹配时应用行动。下子播放 `place.wav`，走子播放 `move.wav`，对局结束按用户胜负播放 `victory.wav` / `defeat.wav`，并在 `visibilitychange` 中暂停/恢复背景音乐。

- [ ] **Step 5: Implement bilingual strings and rules modal**

  将 Flutter `app_strings.dart` 与 `rules_sheet.dart` 的中文/英文文案迁移为 JS 文案表，覆盖标题、副标题、阶段、状态、吃法、按钮、音量标签、棋盘无障碍标签和规则页。语言切换立即重绘并持久化。

- [ ] **Step 6: Run unit tests and browser smoke checks**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: all tests PASS。

  Then serve locally with `python -m http.server 8000` and verify in a browser: home buttons, both modes, placement, movement, capture confirmation, restart, return home, language menu, rules modal, volume sliders, and mobile-width layout.

- [ ] **Step 7: Commit the playable game**

  ```bash
  git add web-game/four-lines
  git commit -m "feat: complete four lines web gameplay"
  ```

### Task 5: 接入 PlayVisor 首页、文档和发布前验证

**Files:**
- Modify: `index.html`
- Modify: `README.md`
- Test: `web-game/four-lines/game-core.test.js`

**Interfaces:**
- Consumes: 已完成的 `web-game/four-lines/index.html` 和所有资源。
- Produces: 首页“四条”卡片、文档入口说明、可部署静态目录。

- [ ] **Step 1: Write the failing launcher test**

  增加一个 Node `node:test` 文件读取根目录 `index.html`，断言 `games` 数组含有 `name: "四条"` 和 `./web-game/four-lines/index.html`，并断言四条目录的 HTML、棋盘图和五个音频文件存在。

- [ ] **Step 2: Run the launcher test to verify it fails**

  Run: `node --test web-game/four-lines/game-core.test.js`

  Expected: FAIL because the launcher entry and/or resource assertions are not yet present.

- [ ] **Step 3: Add the homepage card and README entry**

  在 `index.html` 的 `games` 数组加入“四条”卡片，使用轻量 SVG/棋盘图标；在 README 的目录、功能和新增游戏说明中加入四条路径。

- [ ] **Step 4: Run the full local test suite**

  Run: `node --test web-game/fast24/game-core.test.js web-game/four-lines/game-core.test.js`

  Expected: all existing Fast 24 tests and all 四条 tests PASS with zero failures.

- [ ] **Step 5: Run final static/browser verification**

  Serve the repository root with `python -m http.server 8000`; verify homepage pagination contains “四条”, clicking it opens the game, and inspect browser console/network for missing resources. Re-test at desktop and narrow mobile viewport.

- [ ] **Step 6: Commit launcher integration**

  ```bash
  git add index.html README.md web-game/four-lines
  git commit -m "feat: add four lines to PlayVisor launcher"
  ```

- [ ] **Step 7: Publish and smoke-test the production site**

  After local verification, sync the repository static files to `/usr/share/nginx/game` using the available deployment mechanism, then request `https://game.iyouhey.com/`, `https://game.iyouhey.com/web-game/four-lines/index.html`, and representative assets. Confirm HTTPS responses, the homepage card, and game startup. If no server access or sync mechanism is available, report the exact blocker and leave local changes intact.

## Plan Self-Review

- Spec coverage: Tasks 1-2 cover rules and AI; Task 3 covers assets, responsive shell, audio and persistence; Task 4 covers UI, modes, i18n, rules and stale AI requests; Task 5 covers launcher, documentation, full tests and deployment.
- Step scan: each task has red, green, implementation, verification and commit steps; browser-only behavior is explicitly verified manually because no browser dependency exists in the repository.
- Type/interface consistency: `FourLinesCore` is the shared global, `FourLinesAI` consumes its state/action shape, and `GameController` consumes both. Settings and request guard helpers are specified before their tests.
- Review focus coverage: every listed failure mode is assigned to a core, AI, settings or controller test/verification step.
- Proportion: the plan specifies file boundaries, exact public functions and test commands without reproducing implementation bodies.

