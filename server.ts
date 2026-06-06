import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

/**
 * RedHydra OpenCore local server.
 *
 * No Google/GCP/Gemini SDK.
 * No service account.
 * No built-in API key.
 *
 * GitHub Pages does not run this file. It is only for local Node hosting.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildLocalReply(messages: Array<{ role: string; content: string }>) {
  const last = messages[messages.length - 1]?.content || "";
  const normalized = last.toLowerCase();

  if (normalized.includes("api key") || normalized.includes("gcp") || normalized.includes("gemini")) {
    return `### RedHydra OpenCore Local Server

This server build does not use Google/GCP/Gemini credentials.

- No built-in API key
- No service account
- No cloud AI dependency
- Safe for open-source publication

For real LLM responses, run a local OpenAI-compatible server such as Ollama and connect it from the app settings.`;
  }

  if (normalized.includes("deploy") || normalized.includes("github pages")) {
    return `### Deployment Note

GitHub Pages is static hosting. It will serve the React/Vite frontend from the built \`dist\` folder, but it will not run \`server.ts\`.

The public build now works without calling backend routes by default.`;
  }

  if (normalized.includes("security") || normalized.includes("owasp") || normalized.includes("vulnerability")) {
    return `### Defensive Security Checklist

1. Remove hardcoded secrets from the repository.
2. Use environment variables only on private backend hosts.
3. Add secret scanning before release.
4. Use parameterized database queries.
5. Keep dependency versions patched.`;
  }

  return `### RedHydra OpenCore Local Mode

The local server is running without any cloud API key.

Paste a code snippet, error log, or deployment issue and RedHydra will return structured local guidance.`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: "opencore-local-no-key",
      cloudProvider: "none",
      requiresApiKey: false,
    });
  });

  app.post("/api/chat", (req, res) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    res.json({ text: buildLocalReply(messages) });
  });

  app.post("/api/chat-stream", (req, res) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const text = buildLocalReply(messages);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    let index = 0;
    const chunkSize = 20;

    const timer = setInterval(() => {
      if (index >= text.length) {
        res.write("data: [DONE]\\n\\n");
        clearInterval(timer);
        res.end();
        return;
      }

      const chunk = text.slice(index, index + chunkSize);
      index += chunkSize;
      res.write(`data: ${JSON.stringify({ text: chunk })}\\n\\n`);
    }, 20);
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`RedHydra OpenCore local no-key server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start RedHydra OpenCore server:", error);
  process.exit(1);
});
