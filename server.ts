import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildReply(messages: Array<{ role: string; content: string }>) {
  const last = messages[messages.length - 1]?.content || "";
  const lower = last.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi")) {
    return "Hi, I’m RedHydra OpenCore. How can I help?";
  }

  if (lower.includes("weather")) {
    return "Which city should I check the weather for?";
  }

  if (lower.includes("exit code 1")) {
    return "Exit code 1 means the build failed. Send the full error above that line and I’ll fix it.";
  }

  if (lower.includes("fix") || lower.includes("code") || lower.includes("error") || lower.includes("bug")) {
    return "Send the code or full error log, and I’ll give the corrected version.";
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
    const timer = setInterval(() => {
      if (index >= text.length) {
        res.write("data: [DONE]\n\n");
        clearInterval(timer);
        res.end();
        return;
      }

      const chunk = text.slice(index, index + 24);
      index += 24;
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
