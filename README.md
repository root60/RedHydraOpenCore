# RedHydra OpenCore

RedHydra OpenCore is a static-first React/Vite security and developer-assistance workspace.

This fixed version removes the required Google/GCP/Gemini key path.

## Default public mode

The GitHub Pages version runs in **OpenCore Local Mode** by default.

- No GCP API key
- No Google service account
- No built-in vendor key
- No login required
- No backend required for the default public chat path
- Safe for open-source publication

## What this means

The default public mode is a local guided assistant. It gives structured help for:

- GitHub Pages deployment
- Code review checklists
- Defensive cybersecurity guidance
- File/text review
- Secret-removal guidance

It is not a hosted cloud LLM. A real hosted LLM requires a real backend or a user-owned provider key. A truly free public cloud LLM key should not be hardcoded into an open-source repository.

## Optional real LLM support

Users can optionally connect their own provider from Settings:

- Local Ollama / OpenAI-compatible local server
- OpenRouter with their own key
- OpenAI-compatible endpoint with their own key

The project does not ship with shared credentials.

## GitHub Pages deployment

Use:

```bash
npm install
npm run build:pages
```

GitHub Pages must use:

```text
Settings → Pages → Build and deployment → Source → GitHub Actions
```

The workflow builds the static Vite app and publishes `dist`.

## Local development

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

The local Node server also runs without GCP/Gemini credentials.

## Important

GitHub Pages cannot run `server.ts`, Express routes, or private environment variables. That is why this fix makes the public frontend work without depending on `/api/chat` by default.
