import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

/**
 * RedHydra OpenCore local server.
 *
 * No Google/GCP/Gemini SDK.
 * No service account.
 * No built-in shared API key.
 * Clean direct responses only.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildLocalReply(messages: Array<{ role: string; content: string }>) {
  const last = messages[messages.length - 1]?.content || "";
  const normalized = last.toLowerCase();

  if (normalized.includes("api key") || normalized.includes("gcp") || normalized.includes("gemini")) {
    return "This build does not require a GCP/Gemini API key. Do not hardcode shared keys. Use local no-key mode by default, or let users add their own provider key if needed.";
  }

  if (normalized.includes("deploy") || normalized.includes("github pages")) {
    return "GitHub Pages can only host the static frontend. Build with npm run build:pages and publish the dist folder.";
  }

  if (normalized.includes("security") || normalized.includes("owasp") || normalized.includes("vulnerability")) {
    return "For defensive security, remove hardcoded secrets, validate inputs, use parameterized queries, sanitize unsafe HTML, add rate limiting, and keep dependencies patched.";
  }

  if (normalized.includes("code") || normalized.includes("fix") || normalized.includes("bug")) {
    return "Paste the code or error log and I will give the corrected version directly.";
  }

  return "RedHydra is running in clean no-key local mode. Send code, an error log, or a question and I will answer directly.";
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: "opencore-local-no-key",
      requiresApiKey: false,
      responseStyle: "clean-direct",
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
    const chunkSize = 24;

    const timer = setInterval(() => {
      if (index >= text.length) {
        res.write("data: [DONE]\n\n");
        clearInterval(timer);
        res.end();
        return;
      }

      const chunk = text.slice(index, index + chunkSize);
      index += chunkSize;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }, 15);
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
    console.log(`RedHydra clean no-key server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
