# OpenCore

OpenCore is a local-first AI chatbot workspace built with Next.js. The landing page is now split into separate routed pages so the project feels cleaner and easier to navigate.

## Pages

- `/` — short landing/profile hub
- `/about` — assistant profile and personas
- `/features` — chatbot and gateway feature overview
- `/models` — OpenAI, Hugging Face Space, local, and gateway model profiles
- `/voice` — live voice input and audio reply notes
- `/privacy` — key handling and repo hygiene
- `/setup` — local run and Git push commands
- `/chat` — main chatbot UI
- `/v1/chat/completions` — OpenAI-compatible gateway endpoint
- `/v1/models` — model listing endpoint

## Run locally

```powershell
cd C:\Users\nahid\RedHydraOpenCore
npm install
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/chat
```

## Environment

Create `.env.local` from `.env.example` and add only the keys you need.

```env
OPENAI_API_KEY="your-openai-key"
OPENCORE_GATEWAY_SECRET="replace-with-a-long-random-secret"
OPENCORE_GATEWAY_ADMIN_KEY="replace-with-an-admin-token"
OPENCORE_TTS_MODEL="gpt-4o-mini-tts"
HF_TOKEN="your-huggingface-token"
```

## Push to GitHub

```powershell
git add .
git commit -m "Clean repo and split landing pages"
git push -u origin main
```

## Notes

The repository intentionally excludes `node_modules`, `.next`, `.env.local`, local gateway data, logs, archives, and temporary files.
