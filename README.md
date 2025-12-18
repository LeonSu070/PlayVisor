# PlayVisor

Mini game portal showcasing a collection of browser-based games with a simple carousel interface.

## Features

- **One-page launcher** with responsive grid layout that adapts to the viewport.
- **Keyboard/mouse and touch support** for paging through the game list.
- **Curated game library** including platformers, puzzles, runners, and classics like Snake and Tetris.
- **Zero-build static site** – open the page locally or host it on any static file server.

## Project structure

```
/
├─ index.html                # Game launcher and carousel UI
├─ web-game/                 # Individual game directories
│  ├─ SimpleGame/
│  ├─ SuperMarioRun/
│  ├─ chess/
│  ├─ first-game/
│  ├─ gameSuperMario/
│  ├─ h5study/
│  ├─ second-game/
│  ├─ snake/
│  ├─ space-runner/
│  ├─ subway-surfers/
│  ├─ tetris/
│  ├─ third-game/
│  └─ tower-defense/
├─ super_mario_icon.svg
├─ space_runner_icon.svg
├─ pengyou.png
└─ LICENSE
```

Each folder inside `web-game/` is a self-contained HTML/JS/CSS mini game referenced by the launcher carousel defined in `index.html`.

## Running locally

1. Clone the repository.
2. Open `index.html` directly in your browser, **or** serve the project from the root directory:
   ```bash
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000` to browse and launch games.

## Navigating the launcher

- Use the on-screen arrows to move between pages of game icons.
- Swipe left/right on touch devices to navigate.
- Click or tap any game card to open it in the same tab.

## Adding a new game

1. Create a new folder under `web-game/` with your game's assets and entry `index.html`.
2. Add an entry to the `games` array in `index.html` with:
   - `name`: Display name.
   - `img`: Path to an icon (SVG/PNG or emoji via `emojiIcon` helper).
   - `link`: Relative path to the game's `index.html`.
3. Reload the launcher to see the new game card appear in the carousel.

## License

This project is licensed under the [Apache License 2.0](./LICENSE).
