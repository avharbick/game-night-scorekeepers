# How the app works

The app is split into a shared game library and individual game modules:

- `src/App.tsx` displays the game library and launches a selected module.
- `src/games/catalog.ts` lists the games shown in the library.
- `src/games/farkle/FarkleGame.tsx` contains Farkle's data structures, rules, saved-state logic, and screens.
- `src/style.css` controls colors, spacing, typography, buttons, and phone layout.

## Data flow

React state holds the current players, active turn, score being entered, rules, undo snapshot, and game history. A React effect saves that state to the browser under the key `game-night-farkle-v1`. Another effect restores it when the app opens.

Nothing is sent to a server. Browser developer tools can show the saved JSON under **Application → Local Storage**.

## Scoring flow

`completeTurn()` is the main rules function. It:

1. Validates the entered score and opening-score requirement.
2. Saves a snapshot for Undo.
3. Adds the score or records a Farkle.
4. Checks whether the winning score starts a final round.
5. Advances to the next player and round.
6. Calls `finishGame()` after the final turns are complete.

`finishGame()` sorts the players, stores the completed game in history, and returns to setup.

## Screens

The `screen` variable chooses among setup, active game, and history. The settings sheet is an overlay controlled by `settingsOpen`. This is a single-page app, so there is no page router or server.

## Install and offline behavior

`public/manifest.webmanifest` gives the installed app its name, colors, and icons. `public/sw.js` is the service worker that caches downloaded files and serves them when the network is unavailable.

## Easy changes

- Default rules: edit `DEFAULT_SETTINGS` near the top of `src/games/farkle/FarkleGame.tsx`.
- Default players: edit `DEFAULT_NAMES`.
- Colors: edit the variables at the top of `src/style.css`.
- Quick-score buttons: find `[50, 100, 500, 1000]` in `src/games/farkle/FarkleGame.tsx`.
- App name and description: edit `index.html` and `public/manifest.webmanifest`.

## Adding another game later

Create a new component under `src/games/` that accepts the `GameModuleProps` type, then add one entry to `src/games/catalog.ts`. The shared library will create the new game card automatically. Give each module its own local-storage key so its settings and history remain independent.
