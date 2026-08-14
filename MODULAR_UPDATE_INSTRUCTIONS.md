# Install the modular Game Night update

1. Close the running Vite terminal with **Ctrl+C**.
2. Extract this update over the root of your cloned Game Night repository.
3. Allow Windows to replace files with matching names.
4. Open the repository in VS Code and run `npm run dev`.
5. Confirm that **Choose a game** appears first and that selecting **Farkle** opens the familiar setup screen.
6. Test an existing saved game or history, if present. The Farkle storage key has not changed.
7. Run `npm run build`.
8. Commit the files in GitHub Desktop and push them to GitHub.

## New structure

- `src/App.tsx` — shared game-selection screen
- `src/games/catalog.ts` — the list of available games
- `src/games/types.ts` — the interface each game module follows
- `src/games/farkle/FarkleGame.tsx` — all existing Farkle behavior
- `src/style.css` — shared pink styling plus the new library-card styles

To add a future game, create its component under `src/games/` and add its name, description, icon, and component to `src/games/catalog.ts`.
