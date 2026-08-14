# Game Night — portable source

This is the standalone source code for the Game Night Farkle scorekeeper. It has no ChatGPT or OpenAI dependency, no backend, no API key, and no analytics. Game data is stored locally in the browser with `localStorage`.

## Run it on your Windows computer

1. Open this folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Run `npm install` once.
4. Run `npm run dev`.
5. Open the address printed in the terminal.

The main app is in `src/App.tsx`. Its appearance is in `src/style.css`. The install/offline files are in `public/`. See `CODE_GUIDE.md` for a plain-English tour of the scoring and storage logic.

## Recommended hosting: GitHub Pages

1. Create a GitHub repository, such as `game-night`.
2. Put this folder's contents in the repository and push the `main` branch.
3. In the repository, open **Settings → Pages**.
4. Set the deployment source to **GitHub Actions**.

The included `.github/workflows/deploy-pages.yml` builds and publishes the app on every push. The resulting site does not require a ChatGPT login. A public repository makes the source directly readable; do not add secrets because the finished app is public browser code anyway.

## Cloudflare Pages alternative

Connect this GitHub repository to Cloudflare Pages. Use:

- Build command: `npm run build`
- Output directory: `dist`
- Node version: `22`

Cloudflare will rebuild the site whenever you push a change.

## Netlify alternative

Connect the GitHub repository and select the Vite preset, or run `npm run build` and deploy the resulting `dist` folder. Connecting the repository is better for long-term editing because every pushed change is deployed automatically.

## Important data note

Scores and history stay on each browser/device. Changing hosts creates a new website origin, so data from the ChatGPT-hosted version will not automatically follow to the new address. There is currently no account or cloud-sync system.
