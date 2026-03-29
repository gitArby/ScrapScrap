# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScrapScrap is a 2D steampunk platformer game built entirely with HTML5 Canvas and vanilla JavaScript. The player controls a small robot escaping through a procedurally generated factory. The game is served as a static site (GitHub Pages) at scrapscrap.app.

## Running Locally

Open `index.html` via a local HTTP server (e.g., VS Code Live Server). A server is required because the browser blocks local audio file loading otherwise. There is no build system, bundler, or package manager.

The production page loads `game.min.js` (manually minified). The source of truth is `game.js` (~1700 lines). After editing `game.js`, update `game.min.js` and bump the cache-busting query string in `index.html` (`game.min.js?v=...`).

## Architecture

The entire game logic lives in a single IIFE in `game.js`, organized into numbered sections:

1. **Asset loading** (images, audio) — loads 4 image assets and 4 audio files; game loop starts only after all images are loaded.
2. **Player, input, scoring** — keyboard/mouse handlers, player object, Firebase Firestore integration for the leaderboard (top 5 scores, real-time listener, anti-cheat token on save).
3. **Procedural level generator** (`generateLevel()`) — creates platforms (box, gear, fragile, vent, conveyor, spring, qblock, brick), enemies (stompers, turrets, drones), traps, sawblades, lasers, scraps, and a boss every 5 levels. Difficulty scales with `currentLevel` via gap/height/enemy-density multipliers. Safety checks enforce jumpable height differences.
4. **Drawing helpers and UI** — `drawGear()`, `drawBtn()`, HUD, menu screens, settings (volume sliders), credits, leaderboard, game-over input.
5. **Main loop** (`gameLoop` / `update()`) — locked to 60 FPS via `requestAnimationFrame` + delta-time gating. The `update()` function is a large state machine switching on `gameState`: MENU, SETTINGS, CREDITS, LEADERBOARD, PLAYING, PAUSED, GAMEOVER_INPUT.

### Key game states

`gameState` drives all rendering and logic: `MENU` → `PLAYING` ↔ `PAUSED` → `GAMEOVER_INPUT` → `LEADERBOARD` → `MENU`. Settings and Credits are accessible from Menu.

### Platform/entity types

- **Platforms:** box, gear (rotating), fragile (crumbles), vent (launches up), conveyor (moves player), spring, qblock (power-up), brick (breakable)
- **Enemies:** stompers (patrol + charge), turrets (stationary, shoot bullets), drones (flying, shoot + hover)
- **Hazards:** traps (pop-up spikes), sawblades, lasers
- **Collectibles:** scraps (score), power-ups from qblocks (big, golden, extra life)

### External dependencies

- Firebase Firestore (CDN v10.9.0, loaded in `index.html`) for the online leaderboard
- No npm packages, no frameworks

## Language

The codebase comments and UI strings are in Czech. Variable names and function names are in English.
