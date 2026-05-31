# GitHub Pages Deployment for RedHydra AI Chat

This project is ready for GitHub Pages using the included workflow:

`.github/workflows/deploy.yml`

## Steps

1. Create a GitHub repository.
2. Upload/push all project files to the repository.
3. Go to **Repository Settings > Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to the `main` branch.
6. Open the live URL shown in the Actions deployment summary.

## Important note about AI/API features

GitHub Pages hosts only static frontend files. It cannot run `server.ts`, Express routes, or server-side environment variables.

So on GitHub Pages:

- The UI will load.
- The live agent interface will load.
- The built-in `/api/chat` and `/api/chat-stream` backend routes will not run.
- For real AI replies on GitHub Pages, use Settings inside the app and select a browser-callable provider such as OpenAI/OpenRouter with your own key, or deploy the backend separately on Render, Railway, Vercel serverless, Cloud Run, or another Node host.

## Repository path support

The `vite.config.ts` file now auto-detects the GitHub repository name during GitHub Actions builds and sets the correct Vite `base` path:

- `username.github.io` repo => `/`
- normal repo such as `redhydra-ai-chat` => `/redhydra-ai-chat/`

Local development still uses `/`, so `npm run dev` remains normal.


## Emergency blank-page fix

If GitHub Pages shows a blank page, use this setting instead:

- Settings → Pages
- Source: Deploy from a branch
- Branch: main
- Folder: /docs

The `docs/` folder contains the static Vite build. The root `index.html` is only for local Vite development and should not be used as the Pages root.
