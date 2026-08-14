# How the app works

You can understand almost the entire app from two files:

- `src/App.tsx` contains the data structures, scoring rules, saved-state logic, and screens.
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

- Default rules: edit `DEFAULT_SETTINGS` near the top of `src/App.tsx`.
- Default players: edit `DEFAULT_NAMES`.
- Colors: edit the variables at the top of `src/style.css`.
- Quick-score buttons: find `[50, 100, 500, 1000]` in `src/App.tsx`.
- App name and description: edit `index.html` and `public/manifest.webmanifest`.

## Adding another game later

The visible shell is already named Game Night, but the current scoring engine is Farkle-specific. Before adding a second game, move the Farkle types, defaults, and `completeTurn()` rules into `src/games/farkle.tsx`, then add a small game-selection screen. That keeps shared navigation/history separate from each game's rules.
