import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildReply(messages: Array<{ role: string; content: string }>) {
  const last = messages[messages.length - 1]?.content || "";
  const normalized = last.toLowerCase();

  if (normalized.includes("hello") || normalized.includes("hi")) {
    return "Hi, I’m RedHydra OpenCore. How can I help?";
  }

  if (
    normalized.includes("fix") ||
    normalized.includes("code") ||
    normalized.includes("error") ||
    normalized.includes("bug")
  ) {
    return "Send the code or error log, and I’ll give the corrected version.";
  }

  if (normalized.includes("deploy") || normalized.includes("github pages")) {
    return "Send the workflow or deployment log, and I’ll fix it.";
  }

  return "Send the details, and I’ll help directly.";
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "20mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/chat", (req, res) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    res.json({ text: buildReply(messages) });
  });

  app.post("/api/chat-stream", (req, res) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const text = buildReply(messages);

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
    console.log(`RedHydra OpenCore server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
