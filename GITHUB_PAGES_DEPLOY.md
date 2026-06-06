# GitHub Pages Deployment Fix for RedHydraOpenCore

This repository is a Vite React app. For GitHub Pages project hosting at:

https://root60.github.io/RedHydraOpenCore/

Vite must build with this base path:

/RedHydraOpenCore/

## Files fixed

Replace these files in the repository:

- `.github/workflows/deploy.yml`
- `vite.config.ts`
- `package.json`

## GitHub Pages setting

Go to:

Settings → Pages → Build and deployment → Source

Select:

GitHub Actions

Do not select "Deploy from branch" unless you manually build and commit a `/docs` folder.

## Push command

After replacing the files, run:

```bash
npm install
npm run build:pages
git add package.json package-lock.json vite.config.ts .github/workflows/deploy.yml
git commit -m "Fix GitHub Pages deployment"
git push origin main
```

Then open:

https://root60.github.io/RedHydraOpenCore/?v=3

The `?v=3` part helps bypass browser cache.

## Important backend note

GitHub Pages is static hosting only.

The frontend UI can deploy on GitHub Pages, but `server.ts`, Express routes, `/api/chat`, `/api/chat-stream`, and private `.env` variables will not run there.

For backend AI features, deploy the backend separately on a Node host such as Render, Railway, VPS, Cloud Run, or Vercel serverless.
